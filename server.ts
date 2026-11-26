import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const SUBSTACK_FEED_URL = 'https://projectorguideindia.substack.com/feed';
const SUBSTACK_PUBLICATION_URL = 'https://projectorguideindia.substack.com/';
const CACHE_TTL_MS = 10 * 60 * 1000;

interface SubstackArticleItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  author: string;
  excerpt: string;
  plainText: string;
  readTimeMin: number;
  suggestedQuestions: string[];
}

interface FeedCache {
  fetchedAt: number;
  articles: SubstackArticleItem[];
}

let substackCache: FeedCache | null = null;

function createGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, num: string) => {
      const code = Number(num);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"');
}

function stripHtmlToPlainText(html: string): string {
  const withBreaks = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|blockquote|tr)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ');

  return decodeHtmlEntities(withBreaks)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractXmlTag(block: string, tagName: string): string {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i');
  const match = block.match(regex);
  return match ? match[1].trim() : '';
}

function buildSuggestedQuestions(title: string): string[] {
  const lower = title.toLowerCase();
  if (lower.includes('4k')) {
    return [
      'Summarize the main verdict on buying a 4K projector in India in 2026.',
      'Which projectors in our database match the recommendations in this article?',
      'Is pixel-shifted 4K worth the extra INR over 1080p for a 110-inch living room screen?',
      'What ambient light and ALR screen trade-offs should Indian buyers watch for?',
    ];
  }
  return [
    `Summarize the key takeaways from "${title}".`,
    'Which projectors from our database fit the advice in this article?',
    'What room throw distance and ISO lumens do I need for an Indian living room?',
    'How does India heat, dust, and power backup affect this recommendation?',
  ];
}

function parseSubstackRss(xml: string): SubstackArticleItem[] {
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  const articles: SubstackArticleItem[] = [];

  for (let i = 0; i < itemMatches.length && i < 12; i++) {
    const itemXml = itemMatches[i];
    const rawTitle = extractXmlTag(itemXml, 'title');
    const rawLink = extractXmlTag(itemXml, 'link');
    const rawDate = extractXmlTag(itemXml, 'pubDate');
    const rawAuthor = extractXmlTag(itemXml, 'dc:creator') || 'Sudhakar Ram';
    const rawDesc = extractXmlTag(itemXml, 'description');
    const rawContent = extractXmlTag(itemXml, 'content:encoded') || rawDesc;

    const title = decodeHtmlEntities(rawTitle).replace(/<[^>]+>/g, '').trim();
    const link = decodeHtmlEntities(rawLink).trim();
    if (!title || !link.startsWith('https://projectorguideindia.substack.com/')) {
      continue;
    }

    const plainText = stripHtmlToPlainText(rawContent).slice(0, 14000);
    const excerptText = stripHtmlToPlainText(rawDesc) || plainText.slice(0, 260);
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const readTimeMin = Math.max(2, Math.round(wordCount / 200));

    articles.push({
      id: `substack-${i + 1}`,
      title,
      link,
      pubDate: rawDate,
      author: decodeHtmlEntities(rawAuthor).trim() || 'Sudhakar Ram',
      excerpt: excerptText.length > 260 ? `${excerptText.slice(0, 257)}...` : excerptText,
      plainText,
      readTimeMin,
      suggestedQuestions: buildSuggestedQuestions(title),
    });
  }

  return articles;
}

const FALLBACK_ARTICLES: SubstackArticleItem[] = [
  {
    id: 'substack-fallback-1',
    title: 'Is a 4K Projector Worth Buying in India in 2026 ?',
    link: 'https://projectorguideindia.substack.com/p/is-a-4k-projector-worth-buying-in',
    pubDate: '2026',
    author: 'Sudhakar Ram',
    excerpt:
      'A practical breakdown for Indian home cinema buyers comparing 1080p vs pixel-shifted 4K UHD vs native 4K laser projectors, room brightness, screen sizes, and INR value.',
    plainText:
      'Buying a 4K projector in India in 2026 depends on screen size (100 inches and above benefit most), seating distance, ambient daylight control, and INR budget. Above ₹1.2L, modern 4K pixel-shifted DLP and 3LCD projectors deliver sharp streaming and gaming detail, while living rooms with daylight need 2,500+ ISO lumens and an ALR/CLR screen more than extra pixels alone.',
    readTimeMin: 5,
    suggestedQuestions: buildSuggestedQuestions('Is a 4K Projector Worth Buying in India in 2026 ?'),
  },
];

async function getSubstackArticles(): Promise<{ articles: SubstackArticleItem[]; source: 'live' | 'fallback' }> {
  if (substackCache && Date.now() - substackCache.fetchedAt < CACHE_TTL_MS) {
    return { articles: substackCache.articles, source: 'live' };
  }

  try {
    const res = await fetch(SUBSTACK_FEED_URL, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'IbexProjectorsIndia/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw new Error(`Feed HTTP ${res.status}`);
    }
    const xml = await res.text();
    const parsed = parseSubstackRss(xml);
    if (parsed.length > 0) {
      substackCache = { fetchedAt: Date.now(), articles: parsed };
      return { articles: parsed, source: 'live' };
    }
  } catch (err) {
    console.warn('Substack RSS fetch fallback used:', err instanceof Error ? err.message : 'error');
  }

  return { articles: FALLBACK_ARTICLES, source: 'fallback' };
}

function buildAdvisorSystemInstruction(params: {
  articleTitle?: string;
  articleUrl?: string;
  articlePlainText?: string;
  catalogSummary?: string;
  userContext?: { city?: string; primaryUseCase?: string; budgetTier?: string };
  isVoice?: boolean;
}): string {
  const parts: string[] = [
    'You are the IbexProjectorsIndia Optical & Substack Editorial Advisor, assisting buyers, families, and AV installers in India.',
    'Always ground your answers in real Indian living conditions: INR (₹) pricing, Indian daylight/curtains, ceiling fans, heat/monsoon humidity, IP6X sealed optics vs UHP lamps, sine-wave UPS sizing, ISO lumens, throw ratio math, and verified India service/warranty.',
    'Never invent projector models or prices outside the provided IbexProjectorsIndia product database. When referencing a product, state its exact brand, model, ISO lumens, throw ratio, and current INR lowest price from the database.',
  ];

  if (params.isVoice) {
    parts.push(
      'This is a real-time spoken voice conversation. Keep responses natural, warm, concise (2–4 crisp sentences per turn unless asked for deeper detail), and avoid markdown symbols, bullet lists, or URLs spoken aloud.'
    );
  } else {
    parts.push(
      'Give clear, practical, structured explanations in plain prose or short bullet points. If the user asks about a Substack article, clarify the article points directly and connect them to concrete projectors from the database.'
    );
  }

  if (params.userContext) {
    const ctxBits = [
      params.userContext.city ? `City: ${params.userContext.city}` : '',
      params.userContext.primaryUseCase ? `Primary Use Case: ${params.userContext.primaryUseCase}` : '',
      params.userContext.budgetTier ? `Budget Tier: ${params.userContext.budgetTier}` : '',
    ].filter(Boolean);
    if (ctxBits.length > 0) {
      parts.push(`Signed-in Buyer Context: ${ctxBits.join(' | ')}.`);
    }
  }

  if (params.articleTitle) {
    parts.push(
      `\n--- ACTIVE SUBSTACK ARTICLE (${params.articleUrl || SUBSTACK_PUBLICATION_URL}) ---\nTitle: ${params.articleTitle}\nContent:\n${(params.articlePlainText || '').slice(0, 10000)}\n--- END SUBSTACK ARTICLE ---`
    );
  }

  if (params.catalogSummary) {
    parts.push(
      `\n--- LIVE IBEXPROJECTORSINDIA PRODUCT & PRICING DATABASE ---\n${params.catalogSummary.slice(0, 9000)}\n--- END DATABASE ---`
    );
  }

  return parts.join('\n');
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: '512kb' }));

  // 1. Live Substack RSS Article Feed (Allowlisted publication only)
  app.get('/api/substack/articles', async (_req: Request, res: Response) => {
    try {
      const { articles, source } = await getSubstackArticles();
      res.json({
        publication: 'ProjectorGuideIndia (Substack)',
        publicationUrl: SUBSTACK_PUBLICATION_URL,
        source,
        articles,
      });
    } catch {
      res.status(502).json({ error: 'Unable to load Substack articles right now.' });
    }
  });

  // 2. Grounded Text Chatbot Endpoint (gemini-4-hydrogen)
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        message?: unknown;
        history?: unknown;
        article?: { title?: unknown; url?: unknown; plainText?: unknown };
        catalogSummary?: unknown;
        userContext?: { city?: unknown; primaryUseCase?: unknown; budgetTier?: unknown };
      };

      const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : '';
      if (!message) {
        res.status(400).json({ error: 'Please enter a question to ask the advisor.' });
        return;
      }

      const ai = createGenAIClient();
      if (!ai) {
        res.status(503).json({ error: 'Advisor service is not configured yet (missing GEMINI_API_KEY).' });
        return;
      }

      const rawHistory = Array.isArray(body?.history) ? body.history.slice(-12) : [];
      const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

      for (const turn of rawHistory) {
        if (
          turn &&
          typeof turn === 'object' &&
          'role' in turn &&
          'content' in turn &&
          typeof (turn as { content: unknown }).content === 'string'
        ) {
          const role = (turn as { role: unknown }).role === 'assistant' ? 'model' : 'user';
          const text = (turn as { content: string }).content.trim().slice(0, 1500);
          if (text) {
            contents.push({ role, parts: [{ text }] });
          }
        }
      }

      contents.push({ role: 'user', parts: [{ text: message }] });

      const articleTitle =
        typeof body?.article?.title === 'string' ? body.article.title.trim().slice(0, 240) : undefined;
      const articleUrl =
        typeof body?.article?.url === 'string' ? body.article.url.trim().slice(0, 300) : undefined;
      const articlePlainText =
        typeof body?.article?.plainText === 'string'
          ? body.article.plainText.trim().slice(0, 10000)
          : undefined;
      const catalogSummary =
        typeof body?.catalogSummary === 'string' ? body.catalogSummary.trim().slice(0, 9000) : undefined;

      const userContext = body?.userContext
        ? {
            city:
              typeof body.userContext.city === 'string'
                ? body.userContext.city.trim().slice(0, 80)
                : undefined,
            primaryUseCase:
              typeof body.userContext.primaryUseCase === 'string'
                ? body.userContext.primaryUseCase.trim().slice(0, 40)
                : undefined,
            budgetTier:
              typeof body.userContext.budgetTier === 'string'
                ? body.userContext.budgetTier.trim().slice(0, 40)
                : undefined,
          }
        : undefined;

      const systemInstruction = buildAdvisorSystemInstruction({
        articleTitle,
        articleUrl,
        articlePlainText,
        catalogSummary,
        userContext,
        isVoice: false,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      const reply = (response.text || '').trim();
      if (!reply) {
        res.status(502).json({ error: 'The advisor returned an empty response. Please try again.' });
        return;
      }

      res.json({ reply });
    } catch (err) {
      console.error('Chat API error:', err instanceof Error ? err.message : err);
      res.status(502).json({ error: 'Could not reach the advisor right now. Please try again.' });
    }
  });

  // 3. Real-Time Live Voice WebSocket Bridge (/live -> gemini-3.8-live)
  const wss = new WebSocketServer({
    server,
    path: '/live',
    maxPayload: 2 * 1024 * 1024,
  });

  const ALLOWED_VOICES = new Set(['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir']);

  wss.on('connection', (clientWs: WebSocket) => {
    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    let isClosing = false;

    const safeSend = (payload: Record<string, unknown>) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    const closeSession = () => {
      if (isClosing) return;
      isClosing = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // Ignore close errors
        }
        liveSession = null;
      }
    };

    clientWs.on('message', async (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString()) as {
          type?: string;
          data?: string;
          text?: string;
          voiceName?: string;
          articleTitle?: string;
          articleUrl?: string;
          articlePlainText?: string;
          catalogSummary?: string;
          userContext?: { city?: string; primaryUseCase?: string; budgetTier?: string };
        };

        if (msg.type === 'setup') {
          if (liveSession) {
            return;
          }
          const ai = createGenAIClient();
          if (!ai) {
            safeSend({ type: 'error', message: 'Voice advisor is not configured (missing GEMINI_API_KEY).' });
            return;
          }

          const voiceName =
            typeof msg.voiceName === 'string' && ALLOWED_VOICES.has(msg.voiceName)
              ? msg.voiceName
              : 'Zephyr';

          const systemText = buildAdvisorSystemInstruction({
            articleTitle:
              typeof msg.articleTitle === 'string' ? msg.articleTitle.slice(0, 240) : undefined,
            articleUrl: typeof msg.articleUrl === 'string' ? msg.articleUrl.slice(0, 300) : undefined,
            articlePlainText:
              typeof msg.articlePlainText === 'string'
                ? msg.articlePlainText.slice(0, 8000)
                : undefined,
            catalogSummary:
              typeof msg.catalogSummary === 'string' ? msg.catalogSummary.slice(0, 8000) : undefined,
            userContext: msg.userContext,
            isVoice: true,
          });

          liveSession = await ai.live.connect({
            model: 'gemini-3.8-live',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction: {
                parts: [{ text: systemText }],
              },
            },
            callbacks: {
              onopen: () => {
                safeSend({ type: 'ready' });
              },
              onmessage: (liveMsg: LiveServerMessage) => {
                if (liveMsg.serverContent?.interrupted) {
                  safeSend({ type: 'interrupted' });
                }

                const parts = liveMsg.serverContent?.modelTurn?.parts || [];
                for (const part of parts) {
                  if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/pcm')) {
                    safeSend({ type: 'audio', data: part.inlineData.data });
                  }
                }

                if (liveMsg.serverContent?.inputTranscription?.text) {
                  safeSend({
                    type: 'inputTranscript',
                    text: liveMsg.serverContent.inputTranscription.text,
                  });
                }

                if (liveMsg.serverContent?.outputTranscription?.text) {
                  safeSend({
                    type: 'outputTranscript',
                    text: liveMsg.serverContent.outputTranscription.text,
                  });
                }

                if (liveMsg.serverContent?.turnComplete) {
                  safeSend({ type: 'turnComplete' });
                }
              },
              onerror: (err: ErrorEvent) => {
                console.error('Live API error:', err?.message || 'stream error');
                safeSend({ type: 'error', message: 'Voice session encountered a connection error.' });
              },
              onclose: () => {
                liveSession = null;
                safeSend({ type: 'closed' });
              },
            },
          });
          return;
        }

        if (msg.type === 'audio' && liveSession && typeof msg.data === 'string' && msg.data.length > 0) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
          return;
        }

        if (msg.type === 'text' && liveSession && typeof msg.text === 'string') {
          const safeText = msg.text.trim().slice(0, 1000);
          if (safeText) {
            liveSession.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: safeText }] }],
              turnComplete: true,
            });
          }
          return;
        }

        if (msg.type === 'close') {
          closeSession();
        }
      } catch (err) {
        console.error('WebSocket /live message error:', err instanceof Error ? err.message : err);
        safeSend({ type: 'error', message: 'Failed to process live voice message.' });
      }
    });

    clientWs.on('close', closeSession);
    clientWs.on('error', closeSession);
  });

  // 4. Mount Vite dev middlewares or serve built SPA in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`IbexProjectorsIndia server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

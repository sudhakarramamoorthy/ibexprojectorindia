import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBSTACK_NEWSLETTER_URL } from '../data/projectorsIndia';
import { ProjectorModel, SubstackArticle } from '../types/projector';
import { formatInr, getLowestListing } from '../utils/optics';

type AdvisorMode = 'text' | 'voice';
type VoiceStatus = 'idle' | 'connecting' | 'live' | 'error';

const VOICE_OPTIONS = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'] as const;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
}

function buildLiveCatalogSummary(products: ProjectorModel[]): string {
  return products
    .map((m) => {
      const lowest = getLowestListing(m);
      return `${m.brand} ${m.model} | ${m.categoryLabel} | ${m.nativeResolution} | ${m.displayTech} ${m.lightSource} | ${m.isoLumens} ISO lm | Throw ${m.throwRatioMin}-${m.throwRatioMax}:1 | Lowest: ${formatInr(lowest.priceInr)} on ${lowest.site} (MRP ${formatInr(lowest.mrpInr)}) | Sealed Optics: ${m.indiaClimate.sealedOptics ? 'Yes' : 'No'} | Lag: ${m.inputLagMs}ms | Warranty: ${m.warrantyIndia}`;
    })
    .join('\n');
}

export const AssistantHub: React.FC = () => {
  const {
    user,
    userProfile,
    products,
    productsSource,
    chatMessages,
    saveChatMessage,
    clearChatHistory,
    openProductPage,
    setActiveView,
  } = useApp();

  const [articles, setArticles] = useState<SubstackArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesSource, setArticlesSource] = useState<'live' | 'fallback'>('live');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [showFullArticle, setShowFullArticle] = useState(false);

  const [mode, setMode] = useState<AdvisorMode>('text');
  const [inputText, setInputText] = useState('');
  const [sendingText, setSendingText] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Live Voice Conversation State (gemini-3.8-live via WS /live)
  const [voiceName, setVoiceName] = useState<(typeof VOICE_OPTIONS)[number]>('Zephyr');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState('');
  const [voiceTurns, setVoiceTurns] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([]);

  // Refs used inside audio callbacks & WebSocket handlers (avoid stale closures)
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMutedRef = useRef<boolean>(false);
  const userTranscriptBufRef = useRef<string>('');
  const assistantTranscriptBufRef = useRef<string>('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const catalogSummary = useMemo(() => buildLiveCatalogSummary(products), [products]);

  const selectedArticle = useMemo(
    () => articles.find((a) => a.id === selectedArticleId) || articles[0] || null,
    [articles, selectedArticleId]
  );

  // Fetch live Substack articles from server proxy
  useEffect(() => {
    let cancelled = false;
    setArticlesLoading(true);
    fetch('/api/substack/articles')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load articles');
        return res.json() as Promise<{ articles?: SubstackArticle[]; source?: 'live' | 'fallback' }>;
      })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data.articles) ? data.articles : [];
        setArticles(list);
        setArticlesSource(data.source === 'fallback' ? 'fallback' : 'live');
        if (list.length > 0) {
          setSelectedArticleId(list[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setArticlesSource('fallback');
        }
      })
      .finally(() => {
        if (!cancelled) setArticlesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll text chat on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, sendingText]);

  const stopAllPlaybackAudio = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // Ignore already stopped source
      }
    }
    activeSourcesRef.current.clear();
    if (playbackCtxRef.current) {
      nextStartTimeRef.current = playbackCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
  }, []);

  const stopVoiceSession = useCallback(() => {
    stopAllPlaybackAudio();

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {
        // Ignore
      }
      processorRef.current = null;
    }

    if (captureCtxRef.current) {
      captureCtxRef.current.close().catch(() => {});
      captureCtxRef.current = null;
    }

    if (playbackCtxRef.current) {
      playbackCtxRef.current.close().catch(() => {});
      playbackCtxRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'close' }));
        }
        wsRef.current.close();
      } catch {
        // Ignore
      }
      wsRef.current = null;
    }

    setVoiceStatus('idle');
    setIsMuted(false);
    isMutedRef.current = false;
  }, [stopAllPlaybackAudio]);

  // Ensure complete teardown on component unmount
  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, [stopVoiceSession]);

  const playPcm24kBase64 = useCallback((base64Data: string) => {
    const ctx = playbackCtxRef.current;
    if (!ctx) return;

    const int16 = base64ToInt16Array(base64Data);
    if (int16.length === 0) return;

    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime + 0.01, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;

    activeSourcesRef.current.add(source);
    source.onended = () => {
      activeSourcesRef.current.delete(source);
    };
  }, []);

  const startVoiceSession = useCallback(async () => {
    setVoiceError(null);
    setVoiceStatus('connecting');
    setLiveUserTranscript('');
    setLiveAssistantTranscript('');
    userTranscriptBufRef.current = '';
    assistantTranscriptBufRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const captureCtx = new AudioContext({ sampleRate: 16000 });
      captureCtxRef.current = captureCtx;

      const playbackCtx = new AudioContext({ sampleRate: 24000 });
      playbackCtxRef.current = playbackCtx;
      nextStartTimeRef.current = playbackCtx.currentTime;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'setup',
            voiceName,
            articleTitle: selectedArticle?.title || '',
            articleUrl: selectedArticle?.link || SUBSTACK_NEWSLETTER_URL,
            articlePlainText: selectedArticle?.plainText || '',
            catalogSummary,
            userContext: userProfile
              ? {
                  city: userProfile.city,
                  primaryUseCase: userProfile.primaryUseCase,
                  budgetTier: userProfile.budgetTier,
                }
              : undefined,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as {
            type?: string;
            data?: string;
            text?: string;
            message?: string;
          };

          if (msg.type === 'ready') {
            setVoiceStatus('live');
            const source = captureCtx.createMediaStreamSource(stream);
            const processor = captureCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (audioEvent) => {
              if (isMutedRef.current) return;
              const socket = wsRef.current;
              if (!socket || socket.readyState !== WebSocket.OPEN) return;

              const input = audioEvent.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) {
                const clamped = Math.max(-1, Math.min(1, input[i]));
                pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
              }
              socket.send(
                JSON.stringify({
                  type: 'audio',
                  data: arrayBufferToBase64(pcm16.buffer),
                })
              );
            };

            source.connect(processor);
            processor.connect(captureCtx.destination);
            return;
          }

          if (msg.type === 'audio' && msg.data) {
            playPcm24kBase64(msg.data);
            return;
          }

          if (msg.type === 'interrupted') {
            stopAllPlaybackAudio();
            return;
          }

          if (msg.type === 'inputTranscript' && msg.text) {
            userTranscriptBufRef.current = `${userTranscriptBufRef.current}${msg.text}`;
            setLiveUserTranscript(userTranscriptBufRef.current.trim());
            return;
          }

          if (msg.type === 'outputTranscript' && msg.text) {
            assistantTranscriptBufRef.current = `${assistantTranscriptBufRef.current}${msg.text}`;
            setLiveAssistantTranscript(assistantTranscriptBufRef.current.trim());
            return;
          }

          if (msg.type === 'turnComplete') {
            const uText = userTranscriptBufRef.current.trim();
            const aText = assistantTranscriptBufRef.current.trim();
            const artTitle = selectedArticle?.title || 'ProjectorGuideIndia Substack';
            const artUrl = selectedArticle?.link || SUBSTACK_NEWSLETTER_URL;

            if (uText) {
              setVoiceTurns((prev) => [...prev, { id: `vu-${Date.now()}`, role: 'user', text: uText }]);
              void saveChatMessage({
                role: 'user',
                content: uText,
                articleTitle: artTitle,
                articleUrl: artUrl,
                mode: 'voice',
              });
            }
            if (aText) {
              setVoiceTurns((prev) => [
                ...prev,
                { id: `va-${Date.now() + 1}`, role: 'assistant', text: aText },
              ]);
              void saveChatMessage({
                role: 'assistant',
                content: aText,
                articleTitle: artTitle,
                articleUrl: artUrl,
                mode: 'voice',
              });
            }

            userTranscriptBufRef.current = '';
            assistantTranscriptBufRef.current = '';
            setLiveUserTranscript('');
            setLiveAssistantTranscript('');
            return;
          }

          if (msg.type === 'error') {
            setVoiceError(msg.message || 'Voice session error.');
            stopVoiceSession();
            setVoiceStatus('error');
            return;
          }

          if (msg.type === 'closed') {
            stopVoiceSession();
          }
        } catch {
          // Ignore malformed frame
        }
      };

      ws.onerror = () => {
        setVoiceError('Unable to establish live voice connection. Please try again.');
        stopVoiceSession();
        setVoiceStatus('error');
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          stopVoiceSession();
        }
      };
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access to use Live Voice.'
          : 'Could not start microphone or voice session.';
      setVoiceError(msg);
      stopVoiceSession();
      setVoiceStatus('error');
    }
  }, [
    voiceName,
    selectedArticle,
    catalogSummary,
    userProfile,
    playPcm24kBase64,
    stopAllPlaybackAudio,
    stopVoiceSession,
    saveChatMessage,
  ]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    isMutedRef.current = next;
  };

  const handleSendTextQuestion = async (overrideText?: string) => {
    const prompt = (overrideText ?? inputText).trim();
    if (!prompt || sendingText) return;

    setChatError(null);
    setInputText('');
    setSendingText(true);

    const artTitle = selectedArticle?.title || 'ProjectorGuideIndia Substack';
    const artUrl = selectedArticle?.link || SUBSTACK_NEWSLETTER_URL;

    await saveChatMessage({
      role: 'user',
      content: prompt,
      articleTitle: artTitle,
      articleUrl: artUrl,
      mode: 'text',
    });

    try {
      const recentHistory = chatMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: recentHistory,
          article: selectedArticle
            ? {
                title: selectedArticle.title,
                url: selectedArticle.link,
                plainText: selectedArticle.plainText,
              }
            : undefined,
          catalogSummary,
          userContext: userProfile
            ? {
                city: userProfile.city,
                primaryUseCase: userProfile.primaryUseCase,
                budgetTier: userProfile.budgetTier,
              }
            : undefined,
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Advisor could not generate a response.');
      }

      await saveChatMessage({
        role: 'assistant',
        content: data.reply,
        articleTitle: artTitle,
        articleUrl: artUrl,
        mode: 'text',
      });
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Unable to reach advisor right now.');
    } finally {
      setSendingText(false);
    }
  };

  // Detect projector models referenced inside an assistant reply so users can jump straight to specs
  const findMentionedProducts = (text: string): ProjectorModel[] => {
    const lower = text.toLowerCase();
    return products
      .filter((m) => lower.includes(m.model.toLowerCase()))
      .slice(0, 3);
  };

  const articleParagraphs = useMemo(() => {
    if (!selectedArticle?.plainText) return [];
    return selectedArticle.plainText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [selectedArticle]);

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#b4690e]">
            Substack Interactive Reader &amp; Optical Advisor
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D3250]">
            Ask Questions on ProjectorGuideIndia Articles
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Clarify buying guides from our Substack publication via text chat or real-time voice—grounded
            directly in our live {products.length}-model India database and current INR marketplace pricing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!user && (
            <button
              type="button"
              onClick={() => setActiveView('signup')}
              className="px-4 py-2 text-xs font-semibold text-[#203656] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              Sign Up to Save History
            </button>
          )}
          <a
            href={SUBSTACK_NEWSLETTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#203656] hover:bg-[#172842] rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Open Substack</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Two-Column Workspace: Left = Substack Articles, Right = Text Chat & Live Voice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Substack Publication Articles */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#b4690e]" />
              <h2 className="text-sm font-bold text-[#1D3250]">Substack Articles</h2>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {articlesSource === 'live' ? 'Synced from Substack RSS' : 'Featured Guide'}
            </span>
          </div>

          <div className="p-5 space-y-5">
            {articlesLoading ? (
              <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#203656]" />
                <span>Loading articles from projectorguideindia.substack.com...</span>
              </div>
            ) : (
              <>
                {/* Article Selector List */}
                <div className="space-y-2.5">
                  {articles.map((article) => {
                    const isSelected = selectedArticle?.id === article.id;
                    return (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => {
                          setSelectedArticleId(article.id);
                          setShowFullArticle(false);
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-colors ${
                          isSelected
                            ? 'border-[#203656] bg-[#203656]/[0.03]'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between gap-2">
                          <span>By {article.author}</span>
                          <span className="font-mono tabular-nums">{article.readTimeMin} min read</span>
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-[#1D3250] leading-snug">
                          {article.title}
                        </h3>
                        <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Article Reader + Quick Clarification Prompts */}
                {selectedArticle && (
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFullArticle((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#203656] hover:text-[#b4690e]"
                      >
                        {showFullArticle ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            <span>Hide Full Article Text</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            <span>Read Article Excerpt &amp; Notes Here</span>
                          </>
                        )}
                      </button>

                      <a
                        href={selectedArticle.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#b4690e] hover:underline"
                      >
                        <span>Read on Substack</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {showFullArticle && (
                      <div className="max-h-72 overflow-y-auto p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700 leading-relaxed">
                        {articleParagraphs.slice(0, 18).map((para, idx) => (
                          <p key={idx}>{para}</p>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#1D3250]">
                        Ask a clarification on this article
                      </div>
                      <div className="space-y-2">
                        {selectedArticle.suggestedQuestions.map((q) => (
                          <button
                            key={q}
                            type="button"
                            disabled={sendingText}
                            onClick={() => {
                              setMode('text');
                              void handleSendTextQuestion(q);
                            }}
                            className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Right Column: Interactive Text Chat + Live Voice Conversation */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          {/* Segmented Mode Header */}
          <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
            <div className="inline-flex p-1 bg-slate-200/75 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  if (voiceStatus !== 'idle') stopVoiceSession();
                  setMode('text');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  mode === 'text'
                    ? 'bg-white text-[#203656] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Text Chatbot</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('voice')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  mode === 'voice'
                    ? 'bg-white text-[#203656] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Live Voice Call</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>
                {productsSource === 'database' ? 'Live Firestore Pricing' : 'Verified India Pricing'}
              </span>
              {chatMessages.length > 0 && mode === 'text' && (
                <button
                  type="button"
                  onClick={() => void clearChatHistory()}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors"
                  title="Clear chat history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* TEXT CHAT MODE */}
          {mode === 'text' ? (
            <div className="flex flex-col h-[560px]">
              {/* Active Context Banner */}
              {selectedArticle && (
                <div className="px-5 py-2.5 bg-[#203656]/[0.04] border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-3">
                  <span className="truncate">
                    Context: <strong className="text-[#1D3250]">{selectedArticle.title}</strong>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-slate-500">
                    {products.length} DB Models
                  </span>
                </div>
              )}

              {/* Scrollable Messages */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="py-10 text-center space-y-3 max-w-md mx-auto">
                    <div className="w-11 h-11 rounded-full bg-[#203656] text-[#f5c163] flex items-center justify-center mx-auto">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#1D3250]">
                      Ask anything about our Substack guides or India projector pricing
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pick a clarification prompt on the left or type your room dimensions, budget
                      in INR, or question about the article below.
                    </p>
                  </div>
                )}

                {chatMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const mentioned = !isUser ? findMentionedProducts(msg.content) : [];
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? 'bg-[#203656] text-white'
                            : 'bg-slate-50 border border-slate-200 text-slate-800'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {mentioned.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {mentioned.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => openProductPage(m.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#203656] bg-white border border-slate-200 hover:border-[#203656] rounded-md transition-colors"
                            >
                              <span>
                                {m.brand} {m.model}
                              </span>
                              <span className="font-mono tabular-nums text-[#b4690e]">
                                {formatInr(getLowestListing(m).priceInr)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-1 text-[10px] text-slate-400">
                        {isUser ? 'You' : 'Ibex Advisor'} · {msg.mode === 'voice' ? 'Voice' : 'Text'}
                      </div>
                    </div>
                  );
                })}

                {sendingText && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#203656]" />
                    <span>Checking article details &amp; live INR catalog...</span>
                  </div>
                )}
              </div>

              {chatError && (
                <div className="mx-5 mb-2 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{chatError}</span>
                </div>
              )}

              {/* Input Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendTextQuestion();
                }}
                className="p-4 border-t border-slate-200 bg-white flex items-center gap-2.5"
              >
                <input
                  type="text"
                  maxLength={2000}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about throw distance, 4K vs 1080p, INR prices, or this Substack article..."
                  className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#203656]"
                />
                <button
                  type="submit"
                  disabled={sendingText || !inputText.trim()}
                  className="btn-luxury inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg disabled:opacity-50 whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          ) : (
            /* LIVE VOICE CONVERSATION MODE */
            <div className="p-6 space-y-6 min-h-[560px] flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-[#1D3250] flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#b4690e]" />
                      <span>Real-Time Spoken Optical Consultation</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Talk naturally about the selected Substack article, your living room lighting,
                      or INR projector recommendations. You can interrupt anytime.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
                    <span>Voice:</span>
                    <select
                      value={voiceName}
                      disabled={voiceStatus !== 'idle'}
                      onChange={(e) => setVoiceName(e.target.value as (typeof VOICE_OPTIONS)[number])}
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg disabled:opacity-60"
                    >
                      {VOICE_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Call Controls */}
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-colors ${
                      voiceStatus === 'live'
                        ? 'bg-[#203656] border-[#df9f20] text-[#f5c163]'
                        : 'bg-slate-100 border-slate-200 text-[#203656]'
                    }`}
                  >
                    {voiceStatus === 'connecting' ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : isMuted ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#1D3250]">
                      {voiceStatus === 'idle' && 'Ready to start voice consultation'}
                      {voiceStatus === 'connecting' && 'Connecting microphone & live advisor...'}
                      {voiceStatus === 'live' &&
                        (isMuted ? 'Microphone muted — Advisor listening paused' : 'Live voice call active — Speak now')}
                      {voiceStatus === 'error' && 'Voice session stopped'}
                    </div>
                    {selectedArticle && (
                      <div className="text-xs text-slate-500">
                        Grounded in: {selectedArticle.title}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {voiceStatus === 'live' || voiceStatus === 'connecting' ? (
                      <>
                        <button
                          type="button"
                          onClick={toggleMute}
                          disabled={voiceStatus !== 'live'}
                          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#203656] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50"
                        >
                          {isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                          <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopVoiceSession}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                        >
                          <PhoneOff className="w-4 h-4" />
                          <span>End Voice Call</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void startVoiceSession()}
                        className="btn-luxury inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Live Voice Conversation</span>
                      </button>
                    )}
                  </div>
                </div>

                {voiceError && (
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{voiceError}</span>
                  </div>
                )}

                {/* Live Transcripts */}
                {(liveUserTranscript || liveAssistantTranscript || voiceTurns.length > 0) && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3 max-h-56 overflow-y-auto">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Live Voice Transcript
                    </div>
                    {voiceTurns.map((turn) => (
                      <div key={turn.id} className="text-xs leading-relaxed">
                        <span className="font-bold text-[#1D3250]">
                          {turn.role === 'user' ? 'You: ' : 'Advisor: '}
                        </span>
                        <span className="text-slate-700">{turn.text}</span>
                      </div>
                    ))}
                    {liveUserTranscript && (
                      <div className="text-xs leading-relaxed text-slate-600">
                        <span className="font-bold text-[#1D3250]">You: </span>
                        {liveUserTranscript}
                      </div>
                    )}
                    {liveAssistantTranscript && (
                      <div className="text-xs leading-relaxed text-[#203656]">
                        <span className="font-bold">Advisor: </span>
                        {liveAssistantTranscript}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                Completed voice exchanges are also saved to your conversation transcript for reference.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

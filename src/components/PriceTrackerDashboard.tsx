import React, { useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  ExternalLink,
  Mail,
  Plus,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import { useApp, getSuggestedTargetPrice } from '../context/AppContext';
import { SUBSTACK_NEWSLETTER_URL } from '../data/projectorsIndia';
import { PricePoint } from '../types/projector';
import { formatInr, getLowestListing } from '../utils/optics';

const PriceSparkline: React.FC<{ points: PricePoint[]; targetPriceInr: number }> = ({
  points,
  targetPriceInr,
}) => {
  if (points.length < 2) return null;
  const w = 180;
  const h = 48;
  const pad = 6;

  const prices = [...points.map((p) => p.priceInr), targetPriceInr];
  const minP = Math.min(...prices) * 0.98;
  const maxP = Math.max(...prices) * 1.02;
  const span = Math.max(1, maxP - minP);

  const toX = (idx: number) => pad + (idx / (points.length - 1)) * (w - pad * 2);
  const toY = (price: number) => h - pad - ((price - minP) / span) * (h - pad * 2);

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.priceInr).toFixed(1)}`)
    .join(' ');

  const targetY = toY(targetPriceInr);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <line
        x1={pad}
        y1={targetY}
        x2={w - pad}
        y2={targetY}
        stroke="#16A34A"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <path d={pathD} fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={p.month} cx={toX(i)} cy={toY(p.priceInr)} r="2.5" fill="#1D4ED8" />
      ))}
    </svg>
  );
};

export const PriceTrackerDashboard: React.FC = () => {
  const {
    t,
    products,
    getProductById,
    priceWatches,
    addOrUpdatePriceWatch,
    togglePriceWatchAlert,
    removePriceWatch,
    openProductPage,
    markNewsletterSubscribed,
  } = useApp();

  const defaultModelId = products[1]?.id || products[0]?.id || 'benq-x3100i';
  const [newModelId, setNewModelId] = useState<string>(defaultModelId);
  const [newTargetPrice, setNewTargetPrice] = useState<number>(() =>
    getSuggestedTargetPrice(defaultModelId, products)
  );
  const [newNote, setNewNote] = useState('');

  const enrichedWatches = useMemo(() => {
    return priceWatches
      .map((watch) => {
        const model = getProductById(watch.modelId);
        if (!model) return null;
        const lowest = getLowestListing(model);
        const peak90d = Math.max(...model.priceHistory90d.map((p) => p.priceInr), lowest.priceInr);
        const dropFromPeak = peak90d - lowest.priceInr;
        const dropPct = peak90d > 0 ? Math.round((dropFromPeak / peak90d) * 100) : 0;
        const targetReached = lowest.priceInr <= watch.targetPriceInr;
        return {
          watch,
          model,
          lowest,
          peak90d,
          dropFromPeak,
          dropPct,
          targetReached,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [priceWatches, getProductById]);

  const targetHitCount = enrichedWatches.filter((w) => w.targetReached).length;
  const totalSavingsInr = enrichedWatches.reduce((sum, w) => sum + w.dropFromPeak, 0);

  const handleAddWatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await addOrUpdatePriceWatch(newModelId, newTargetPrice, newNote);
    setNewNote('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {t.trackerTitle}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">{t.trackerSub}</p>
      </div>

      {/* 3-Column Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Tracked India Models</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {enrichedWatches.length}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">Cloud-synced when signed in</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Target Prices Reached</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {targetHitCount}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">Ready to buy on Indian retailers</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Cumulative 90-Day Drop</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-blue-700">
            {formatInr(totalSavingsInr)}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">Savings vs. 90-day peak pricing</div>
        </div>
      </div>

      {/* Add New Price Watch Form */}
      <form
        onSubmit={handleAddWatch}
        className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
      >
        <div className="md:col-span-4">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Select India Projector Model
          </label>
          <select
            value={newModelId}
            onChange={(e) => {
              const id = e.target.value;
              setNewModelId(id);
              setNewTargetPrice(getSuggestedTargetPrice(id, products));
            }}
            className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {products.map((m) => (
              <option key={m.id} value={m.id}>
                {m.brand} {m.model} — {formatInr(getLowestListing(m).priceInr)}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Target Alert Price (₹ INR)
          </label>
          <input
            type="number"
            min={5000}
            max={5000000}
            step={500}
            value={newTargetPrice}
            onChange={(e) => setNewTargetPrice(Number(e.target.value) || 50000)}
            className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Sale / Note (Optional)
          </label>
          <input
            type="text"
            maxLength={300}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="e.g., Republic Day sale target"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Track Model</span>
          </button>
        </div>
      </form>

      {/* Watchlist Items */}
      {enrichedWatches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <TrendingDown className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="mt-2 text-sm font-semibold text-slate-900">Your price-drop watchlist is empty</p>
          <p className="mt-1 text-xs text-slate-500">
            Add a projector above to monitor 90-day INR price trends across Indian marketplaces.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {enrichedWatches.map(({ watch, model, lowest, dropPct, dropFromPeak, targetReached }) => (
            <div
              key={watch.id}
              className="p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-5"
            >
              {/* Left: Identity & Notes */}
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => openProductPage(model.id)}
                  className="w-20 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0"
                >
                  <img
                    src={model.imageUrl}
                    alt={`${model.brand} ${model.model}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-slate-700">{model.brand}</span>
                    <span>·</span>
                    <span>{lowest.site}</span>
                    <span>·</span>
                    <span
                      className={`font-semibold ${
                        targetReached ? 'text-emerald-700' : 'text-blue-700'
                      }`}
                    >
                      {targetReached ? 'Target Price Reached' : 'Monitoring Drop'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openProductPage(model.id)}
                    className="mt-0.5 text-base font-bold text-slate-900 hover:text-blue-700 text-left block"
                  >
                    {model.brand} {model.model}
                  </button>
                  {watch.notes && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{watch.notes}</p>
                  )}
                </div>
              </div>

              {/* Middle: 90-Day Price Sparkline */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 shrink-0">
                <div>
                  <PriceSparkline
                    points={model.priceHistory90d}
                    targetPriceInr={watch.targetPriceInr}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-0.5">
                    <span>{model.priceHistory90d[0]?.month}</span>
                    <span>90-day trend (green = target)</span>
                    <span>{model.priceHistory90d[model.priceHistory90d.length - 1]?.month}</span>
                  </div>
                </div>

                {/* Pricing Metrics */}
                <div className="grid grid-cols-2 gap-4 text-xs min-w-[210px]">
                  <div>
                    <div className="text-slate-400 text-[11px]">Current Best INR</div>
                    <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                      {formatInr(lowest.priceInr)}
                    </div>
                    {dropPct > 0 && (
                      <div className="text-[11px] font-mono tabular-nums text-emerald-700">
                        -{dropPct}% ({formatInr(dropFromPeak)})
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Your Target</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-slate-700 mt-0.5">
                      {formatInr(watch.targetPriceInr)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {watch.alertEnabled ? 'Alerts On' : 'Alerts Paused'}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <a
                    href={lowest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <span>Buy on {lowest.site}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => togglePriceWatchAlert(watch.id)}
                    title={watch.alertEnabled ? 'Pause alerts' : 'Enable alerts'}
                    aria-label="Toggle price drop alert"
                    className={`p-2 rounded-lg border transition-colors ${
                      watch.alertEnabled
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {watch.alertEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePriceWatch(watch.id)}
                    title="Remove from watchlist"
                    aria-label={`Remove ${model.brand} ${model.model}`}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Substack Newsletter Subscription Banner */}
      <section className="bg-slate-900 text-white rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
            <Mail className="w-4 h-4" />
            <span>Exclusive India Discount &amp; Launch Dispatch</span>
          </div>
          <h2 className="mt-1.5 text-lg font-bold">{t.newsletterTitle}</h2>
          <p className="mt-1 text-sm text-slate-300 leading-relaxed">
            Subscribe to our Substack dispatch at{' '}
            <span className="font-mono text-blue-200">projectorguideindia.substack.com</span> for verified India projector releases, GST dealer drops, and optical calibration deep-dives.
          </p>
        </div>

        <a
          href={SUBSTACK_NEWSLETTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            void markNewsletterSubscribed();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <span>{t.subscribeSubstack}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </section>
    </div>
  );
};

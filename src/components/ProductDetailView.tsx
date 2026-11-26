import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Crosshair,
  ExternalLink,
  Scale,
  ShieldCheck,
  ShoppingBag,
  TrendingDown,
} from 'lucide-react';
import { useApp, getSuggestedTargetPrice } from '../context/AppContext';
import { calculateOptics, formatInr, formatLength, getLowestListing } from '../utils/optics';

export const ProductDetailView: React.FC = () => {
  const {
    selectedModelId,
    setActiveView,
    openProductPage,
    products,
    getProductById,
    config,
    unit,
    updateConfig,
    compareIds,
    toggleCompareModel,
    addOrUpdatePriceWatch,
    addToCart,
    showToast,
  } = useApp();

  const model = getProductById(selectedModelId) || products[0];
  const calc = useMemo(() => calculateOptics(config), [config]);
  const lowest = useMemo(() => getLowestListing(model), [model]);
  const sortedListings = useMemo(
    () => [...model.listings].sort((a, b) => a.priceInr - b.priceInr),
    [model]
  );

  const [targetPrice, setTargetPrice] = useState<number>(() =>
    getSuggestedTargetPrice(model.id, products)
  );

  const requiredThrowMinM = calc.screenWidthMeters * model.throwRatioMin;
  const requiredThrowMaxM = calc.screenWidthMeters * model.throwRatioMax;
  const estFootLamberts = (model.isoLumens * calc.surfaceGain) / Math.max(1, calc.screenAreaSqFeet);
  const isComparing = compareIds.includes(model.id);

  const handleLoadIntoCalculator = () => {
    const midRatio = Number(((model.throwRatioMin + model.throwRatioMax) / 2).toFixed(2));
    updateConfig({
      throwRatio: midRatio,
      mountingType: model.category === 'ust' ? 'ust_console' : config.mountingType,
    });
    setActiveView('calculator');
    showToast(`Loaded ${model.brand} ${model.model} lens (${midRatio}:1) into Room Planner.`, 'success');
  };

  const relatedModels = products
    .filter((m) => m.id !== model.id && (m.brand === model.brand || m.category === model.category))
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Back Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projector Catalog</span>
        </button>
        <div className="text-xs text-slate-500">
          {model.brand} · {model.categoryLabel}
        </div>
      </div>

      {/* Hero Split: Image + Overview & Room Fit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="aspect-[4/3] bg-slate-100 w-full overflow-hidden">
            <img
              src={model.imageUrl}
              alt={`${model.brand} ${model.model}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">ISO Lumens</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {model.isoLumens.toLocaleString('en-IN')} lm
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Throw Ratio</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {model.throwRatioMin === model.throwRatioMax
                  ? `${model.throwRatioMin}:1`
                  : `${model.throwRatioMin}–${model.throwRatioMax}:1`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Input Lag</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {model.inputLagMs} ms
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{model.brand}</span>
                <span className="mx-1.5">·</span>
                <span>{model.nativeResolution}</span>
                <span className="mx-1.5">·</span>
                <span>{model.displayTech} / {model.lightSource}</span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {model.brand} {model.model}
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{model.tagline}</p>
            </div>

            {/* Live Room Fit Summary for Current Calibration */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-900">
                  Optical Fit for Your Current {Math.round(calc.screenDiagonalInches)}&quot; Screen
                </span>
                <span className="font-mono tabular-nums text-blue-700 font-semibold">
                  Est. {estFootLamberts.toFixed(1)} fL
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                For a <span className="font-mono tabular-nums font-medium">{formatLength(calc.screenWidthMeters, unit, 2)}</span> wide screen, mount this model between{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatLength(requiredThrowMinM, unit, 2)}
                  {requiredThrowMaxM > requiredThrowMinM ? ` – ${formatLength(requiredThrowMaxM, unit, 2)}` : ''}
                </span>{' '}
                from the screen surface.
              </p>
            </div>

            {/* Lowest Verified Price + Actions */}
            <div className="flex flex-wrap items-baseline gap-3 pt-1">
              <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {formatInr(lowest.priceInr)}
              </span>
              {lowest.mrpInr > lowest.priceInr && (
                <span className="text-sm font-mono tabular-nums text-slate-400 line-through">
                  MRP {formatInr(lowest.mrpInr)}
                </span>
              )}
              <span className="text-xs font-medium text-emerald-700">
                Lowest on {lowest.site} · Incl. 18% GST
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleLoadIntoCalculator}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Calibrate with This Lens</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  addToCart({
                    skuId: model.id,
                    itemType: 'projector',
                    title: `${model.brand} ${model.model}`,
                    unitPriceInr: lowest.priceInr,
                    preferredRetailer: lowest.site,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Quote Bag</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCompareModel(model.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  isComparing
                    ? 'border-blue-700 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{isComparing ? 'In Comparison' : 'Compare Specs'}</span>
              </button>
            </div>

            {/* Quick Price-Drop Alert Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <label htmlFor="target-inr" className="text-xs font-medium text-slate-600">
                Price-Drop Target (₹):
              </label>
              <input
                id="target-inr"
                type="number"
                step={1000}
                min={5000}
                max={5000000}
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value) || lowest.priceInr)}
                className="w-32 px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={() => addOrUpdatePriceWatch(model.id, targetPrice, `Tracked from product page`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <TrendingDown className="w-3.5 h-3.5 text-blue-700" />
                <span>Set Alert</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* India-Only Marketplace Price Comparison */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Where to Buy in India — Marketplace Price Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              India-geography retailers and authorized AV integrators only · All prices in INR (₹) inclusive of GST.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-600">
            {sortedListings.length} verified Indian marketplaces
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {sortedListings.map((listing, idx) => {
            const discountPct = Math.round(((listing.mrpInr - listing.priceInr) / listing.mrpInr) * 100);
            return (
              <div
                key={listing.site}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{listing.site}</span>
                    {idx === 0 && (
                      <span className="text-xs font-semibold text-emerald-700">· Lowest Price</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {listing.deliveryNote}
                    {listing.warrantyVerified ? ' · India Warranty Valid' : ''}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-left sm:text-right">
                    <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                      {formatInr(listing.priceInr)}
                    </div>
                    {discountPct > 0 && (
                      <div className="text-[11px] font-mono tabular-nums text-emerald-700">
                        Save {discountPct}% off MRP
                      </div>
                    )}
                  </div>

                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Visit Store</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Complete Technical Specs & India Climate/Warranty Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Optical &amp; Hardware Specifications
          </h2>
          <dl className="divide-y divide-slate-100 text-xs">
            {[
              ['Native Resolution', model.nativeResolution],
              ['Display Architecture', model.displayTech],
              ['Light Source & Rated Life', `${model.lightSource} · ${model.lightSourceLifeHours.toLocaleString('en-IN')} hrs`],
              ['Brightness (ISO / ANSI Ref)', `${model.isoLumens.toLocaleString('en-IN')} ISO lm (${model.ansiLumensRef.toLocaleString('en-IN')} ANSI ref)`],
              ['Throw Ratio Range', model.throwRatioMin === model.throwRatioMax ? `${model.throwRatioMin}:1 (Fixed)` : `${model.throwRatioMin}:1 – ${model.throwRatioMax}:1`],
              ['Optical Zoom', model.opticalZoom],
              ['Lens Shift & Alignment', model.lensShift],
              ['Lens Engineering Details', model.lensDetails],
              ['Contrast Ratio', model.contrastRatio],
              ['Gaming Input Lag & Refresh', `${model.inputLagMs} ms · Up to ${model.maxRefreshHz} Hz`],
              ['HDR & Color Formats', model.hdrSupport],
              ['Smart Platform', model.smartOs],
              ['Integrated Audio', model.builtInAudio],
              ['Weight & Typical Power Draw', `${model.weightKg} kg · ${model.powerWatts} W`],
            ].map(([label, val]) => (
              <div key={label} className="py-2.5 grid grid-cols-12 gap-3">
                <dt className="col-span-5 text-slate-500 font-medium">{label}</dt>
                <dd className="col-span-7 text-slate-900 font-medium">{val}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>India Warranty &amp; Climate Rating</span>
            </h2>
            <dl className="divide-y divide-slate-100 text-xs mt-1">
              <div className="py-2.5">
                <dt className="text-slate-500">Official India Warranty</dt>
                <dd className="mt-0.5 text-slate-900 font-semibold">{model.warrantyIndia}</dd>
              </div>
              <div className="py-2.5">
                <dt className="text-slate-500">Service Network</dt>
                <dd className="mt-0.5 text-slate-800">{model.serviceNetworkIndia}</dd>
              </div>
              <div className="py-2.5">
                <dt className="text-slate-500">Max Ambient Heat Rating</dt>
                <dd className="mt-0.5 font-mono tabular-nums text-slate-900 font-semibold">
                  Up to {model.indiaClimate.maxAmbientTempC}°C
                </dd>
              </div>
              <div className="py-2.5">
                <dt className="text-slate-500">Dust &amp; Monsoon Protection</dt>
                <dd className="mt-0.5 text-slate-800 flex items-center gap-1.5">
                  {model.indiaClimate.sealedOptics && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <span>{model.indiaClimate.dustProtection}</span>
                </dd>
              </div>
              <div className="py-2.5">
                <dt className="text-slate-500">Power Cut Resilience</dt>
                <dd className="mt-0.5 text-slate-900 font-medium">
                  {model.indiaClimate.powerCutResilience}
                </dd>
              </div>
            </dl>
          </div>

          {relatedModels.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 mb-2.5">
                Related Models in India
              </h3>
              <div className="space-y-2">
                {relatedModels.map((rel) => {
                  const relLowest = getLowestListing(rel);
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => openProductPage(rel.id)}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {rel.brand} {rel.model}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {rel.isoLumens.toLocaleString('en-IN')} ISO lm · {rel.throwRatioMin}:1
                        </div>
                      </div>
                      <span className="text-xs font-mono tabular-nums font-bold text-slate-900 shrink-0">
                        {formatInr(relLowest.priceInr)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

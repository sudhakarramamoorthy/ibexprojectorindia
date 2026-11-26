import React, { useMemo } from 'react';
import { Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProjectorModel } from '../types/projector';
import { calculateOptics, formatInr, formatLength, getLowestListing } from '../utils/optics';

export const ComparisonDashboard: React.FC = () => {
  const {
    t,
    config,
    unit,
    products,
    compareIds,
    toggleCompareModel,
    clearCompare,
    openProductPage,
    addToCart,
  } = useApp();

  const calc = useMemo(() => calculateOptics(config), [config]);

  const selectedModels: ProjectorModel[] = useMemo(
    () =>
      compareIds
        .map((id) => products.find((m) => m.id === id))
        .filter((m): m is ProjectorModel => Boolean(m)),
    [compareIds, products]
  );

  const availableToAdd = useMemo(
    () => products.filter((m) => !compareIds.includes(m.id)),
    [compareIds, products]
  );

  const bestPrice = useMemo(
    () =>
      selectedModels.length > 0
        ? Math.min(...selectedModels.map((m) => getLowestListing(m).priceInr))
        : 0,
    [selectedModels]
  );
  const maxLumens = useMemo(
    () => (selectedModels.length > 0 ? Math.max(...selectedModels.map((m) => m.isoLumens)) : 0),
    [selectedModels]
  );
  const minLag = useMemo(
    () => (selectedModels.length > 0 ? Math.min(...selectedModels.map((m) => m.inputLagMs)) : 0),
    [selectedModels]
  );

  return (
    <div className="space-y-6">
      {/* Header & Model Picker */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t.compareTitle}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">{t.compareSub}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {selectedModels.length < 4 && (
            <div className="relative">
              <select
                aria-label="Add projector to comparison"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    toggleCompareModel(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="pl-3 pr-8 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="" disabled>
                  + Add Model to Compare ({selectedModels.length}/4)
                </option>
                {availableToAdd.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.brand} {m.model} ({formatInr(getLowestListing(m).priceInr)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedModels.length > 0 && (
            <button
              type="button"
              onClick={clearCompare}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:text-red-600 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {selectedModels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4">
          <p className="text-base font-semibold text-slate-900">No projectors selected for comparison</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Pick up to 4 models from the Projector Catalog to compare throw distances for your{' '}
            {Math.round(calc.screenDiagonalInches)}&quot; screen, ISO lumens, warranty, and INR prices side by side.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['benq-x3100i', 'epson-eh-tw6250', 'optoma-uhz66', 'hisense-px3-pro'].map((id) => {
              const m = products.find((x) => x.id === id);
              if (!m) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCompareModel(id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{m.brand} {m.model}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="p-4 w-52 align-bottom text-xs font-semibold text-slate-500">
                    Specification ({Math.round(calc.screenDiagonalInches)}&quot; Room Ref)
                  </th>
                  {selectedModels.map((model) => {
                    const lowest = getLowestListing(model);
                    return (
                      <th key={model.id} className="p-4 align-top border-l border-slate-200 min-w-[200px]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs text-slate-500 font-medium">{model.brand}</div>
                          <button
                            type="button"
                            onClick={() => toggleCompareModel(model.id)}
                            aria-label={`Remove ${model.brand} ${model.model}`}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => openProductPage(model.id)}
                          className="mt-1 text-left text-sm font-bold text-slate-900 hover:text-blue-700 block"
                        >
                          {model.model}
                        </button>
                        <div className="mt-2 aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                          <img
                            src={model.imageUrl}
                            alt={`${model.brand} ${model.model}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mt-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openProductPage(model.id)}
                            className="flex-1 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md whitespace-nowrap"
                          >
                            Product Page
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
                            aria-label={`Add ${model.model} to quote bag`}
                            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 rounded-md text-slate-700"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {/* Lowest India Marketplace Price */}
                <tr>
                  <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/40">
                    Lowest India Price (INR)
                  </td>
                  {selectedModels.map((model) => {
                    const lowest = getLowestListing(model);
                    const isBest = lowest.priceInr === bestPrice && selectedModels.length > 1;
                    return (
                      <td key={model.id} className="p-3.5 border-l border-slate-100">
                        <div
                          className={`font-mono tabular-nums text-sm font-bold ${
                            isBest ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {formatInr(lowest.priceInr)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {lowest.site} {isBest ? '· Lowest Cost' : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Throw Distance for User's Room */}
                <tr>
                  <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/40">
                    Throw Distance for {Math.round(calc.screenDiagonalInches)}&quot;
                  </td>
                  {selectedModels.map((model) => {
                    const minD = calc.screenWidthMeters * model.throwRatioMin;
                    const maxD = calc.screenWidthMeters * model.throwRatioMax;
                    return (
                      <td key={model.id} className="p-3.5 border-l border-slate-100 font-mono tabular-nums text-slate-900">
                        {minD === maxD
                          ? formatLength(minD, unit, 2)
                          : `${formatLength(minD, unit, 2)} – ${formatLength(maxD, unit, 2)}`}
                      </td>
                    );
                  })}
                </tr>

                {/* Throw Ratio */}
                <tr>
                  <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/40">Throw Ratio</td>
                  {selectedModels.map((model) => (
                    <td key={model.id} className="p-3.5 border-l border-slate-100 font-mono tabular-nums text-slate-800">
                      {model.throwRatioMin === model.throwRatioMax
                        ? `${model.throwRatioMin}:1`
                        : `${model.throwRatioMin}–${model.throwRatioMax}:1`}
                    </td>
                  ))}
                </tr>

                {/* ISO Lumens */}
                <tr>
                  <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/40">Brightness (ISO Lumens)</td>
                  {selectedModels.map((model) => {
                    const isBest = model.isoLumens === maxLumens && selectedModels.length > 1;
                    const fl = (model.isoLumens * calc.surfaceGain) / Math.max(1, calc.screenAreaSqFeet);
                    return (
                      <td key={model.id} className="p-3.5 border-l border-slate-100">
                        <div
                          className={`font-mono tabular-nums font-bold ${
                            isBest ? 'text-blue-700' : 'text-slate-900'
                          }`}
                        >
                          {model.isoLumens.toLocaleString('en-IN')} ISO lm
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {fl.toFixed(1)} fL in your room {isBest ? '· Brightest' : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Native Resolution */}
                <tr>
                  <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/40">Native Resolution</td>
                  {selectedModels.map((model) => (
                    <td key={model.id} className="p-3.5 border-l border-slate-100 text-slate-900 font-medium">
                      {model.nativeResolution}
                    </td>
                  ))}
                </tr>

                {/* Display Tech & Light Source */}
                <tr>
                  <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/40">Light Source &amp; Life</td>
                  {selectedModels.map((model) => (
                    <td key={model.id} className="p-3.5 border-l border-slate-100 text-slate-800">
                      <div>{model.displayTech} · {model.lightSource}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {model.lightSourceLifeHours.toLocaleString('en-IN')} hrs rated
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Optical Zoom & Lens Shift */}
                <tr>
                  <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/40">Optical Zoom &amp; Shift</td>
                  {selectedModels.map((model) => (
                    <td key={model.id} className="p-3.5 border-l border-slate-100 text-slate-800">
                      <div>{model.opticalZoom}</div>
                      <div className="text-[11px] text-slate-500">{model.lensShift}</div>
                    </td>
                  ))}
                </tr>

                {/* Gaming Input Lag */}
                <tr>
                  <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/40">Input Lag / Max Refresh</td>
                  {selectedModels.map((model) => {
                    const isBest = model.inputLagMs === minLag && selectedModels.length > 1;
                    return (
                      <td key={model.id} className="p-3.5 border-l border-slate-100 font-mono tabular-nums">
                        <span className={isBest ? 'font-bold text-emerald-700' : 'text-slate-900'}>
                          {model.inputLagMs} ms
                        </span>{' '}
                        <span className="text-slate-500">/ {model.maxRefreshHz} Hz</span>
                      </td>
                    );
                  })}
                </tr>

                {/* India Climate & Power */}
                <tr>
                  <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/40">India Dust &amp; Power Cut</td>
                  {selectedModels.map((model) => (
                    <td key={model.id} className="p-3.5 border-l border-slate-100 text-slate-800">
                      <div>{model.indiaClimate.sealedOptics ? 'Sealed Optics' : 'Filter / Open Path'}</div>
                      <div className="text-[11px] text-slate-500">
                        Max {model.indiaClimate.maxAmbientTempC}°C · {model.indiaClimate.powerCutResilience}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Official India Warranty */}
                <tr>
                  <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/40">Official India Warranty</td>
                  {selectedModels.map((model) => (
                    <td key={model.id} className="p-3.5 border-l border-slate-100 text-slate-800">
                      {model.warrantyIndia}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

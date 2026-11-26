import React, { useMemo } from 'react';
import { Printer, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeIndiaGstSummary } from '../commerce/commerceService';
import {
  calculateOptics,
  formatInr,
  formatLength,
  scoreProjectorsForConfig,
} from '../utils/optics';

export const InstallerReportView: React.FC = () => {
  const { t, config, updateConfig, unit, cartItems, saveCurrentConfig, products } = useApp();

  const calc = useMemo(() => calculateOptics(config), [config]);
  const top3 = useMemo(
    () => scoreProjectorsForConfig(products, config, calc).slice(0, 3),
    [products, config, calc]
  );
  const boqSummary = useMemo(() => computeIndiaGstSummary(cartItems), [cartItems]);
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Editable Installer Controls Bar (Hidden in Print / PDF) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {t.installerReportTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Customize client site details in any language and export a clean A4 printable PDF engineering sheet.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => saveCurrentConfig(config.name)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5 text-blue-700" />
              <span>Save Report Setup</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printPdfAction}</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Project / Room Title
            </label>
            <input
              type="text"
              maxLength={120}
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Client / Homeowner Name (Multi-language supported)
            </label>
            <input
              type="text"
              maxLength={120}
              value={config.clientName}
              onChange={(e) => updateConfig({ clientName: e.target.value })}
              placeholder="e.g., Rajesh Sharma / राजेश शर्मा"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Site Location (City / State)
            </label>
            <input
              type="text"
              maxLength={120}
              value={config.projectLocation}
              onChange={(e) => updateConfig({ projectLocation: e.target.value })}
              placeholder="e.g., Indiranagar, Bengaluru"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Installer Field Notes (Cable routing, ceiling fan clearance, acoustic walls)
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={config.notes}
              onChange={(e) => updateConfig({ notes: e.target.value })}
              placeholder="Note drop-rod length, HDMI 2.1 fiber conduit route, or stabilizer location..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Printable A4 Architectural Spec Sheet */}
      <article className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Sheet Header */}
        <header className="pb-5 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-700">
              IbexProjectorsIndia · Professional Installer Site Sheet
            </div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{config.name || 'Optical Installation Spec'}</h2>
            <div className="mt-1 text-xs text-slate-600">
              {config.clientName ? `Client: ${config.clientName} · ` : ''}
              Location: {config.projectLocation || 'India'} · Mount: {config.mountingType.replace('_', ' ')}
            </div>
          </div>
          <div className="text-left sm:text-right text-xs font-mono tabular-nums text-slate-600">
            <div>Date: {reportDate}</div>
            <div>Ref: PGI-{Math.round(calc.screenDiagonalInches)}-{config.throwRatio.toFixed(2)}</div>
          </div>
        </header>

        {/* Optical Geometry Summary Table */}
        <section className="print-break-inside-avoid">
          <h3 className="text-sm font-bold text-slate-900 mb-3">1. Calibrated Optical Geometry</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
            <div className="p-3">
              <div className="text-slate-500">Throw Distance</div>
              <div className="mt-1 font-mono tabular-nums font-bold text-sm text-slate-900">
                {formatLength(calc.throwDistanceMeters, unit, 2)}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                ({calc.throwDistanceMeters.toFixed(2)} m / {calc.throwDistanceFeet.toFixed(2)} ft)
              </div>
            </div>
            <div className="p-3">
              <div className="text-slate-500">Screen Dimensions</div>
              <div className="mt-1 font-mono tabular-nums font-bold text-sm text-slate-900">
                {Math.round(calc.screenDiagonalInches)}&quot; ({config.aspectRatio})
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {formatLength(calc.screenWidthMeters, unit, 2)} W × {formatLength(calc.screenHeightMeters, unit, 2)} H
              </div>
            </div>
            <div className="p-3">
              <div className="text-slate-500">Target Throw Ratio</div>
              <div className="mt-1 font-mono tabular-nums font-bold text-sm text-slate-900">
                {config.throwRatio.toFixed(2)}:1
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Gain {calc.surfaceGain} · Area {calc.screenAreaSqFeet.toFixed(1)} ft²
              </div>
            </div>
            <div className="p-3">
              <div className="text-slate-500">Lumen &amp; Seating Spec</div>
              <div className="mt-1 font-mono tabular-nums font-bold text-sm text-blue-700">
                {calc.recommendedMinIsoLumens.toLocaleString('en-IN')}+ ISO lm
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Seat {formatLength(calc.seatingDistanceMinMeters, unit, 1)}–{formatLength(calc.seatingDistanceMaxMeters, unit, 1)}
              </div>
            </div>
          </div>
        </section>

        {/* Crisp Vector Plan Blueprint for Print */}
        <section className="print-break-inside-avoid">
          <h3 className="text-sm font-bold text-slate-900 mb-2">2. Scaled Top-Down Projection Diagram</h3>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <svg viewBox="0 0 720 190" className="w-full h-auto block">
              <rect x="0" y="0" width="720" height="190" fill="#FFFFFF" />
              {/* Wall & Screen */}
              <line x1="70" y1="20" x2="70" y2="170" stroke="#94A3B8" strokeWidth="2" />
              <rect x="74" y="38" width="6" height="114" fill="#0F172A" />
              <text x="62" y="92" textAnchor="end" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace" fill="#0F172A">
                {Math.round(calc.screenDiagonalInches)}&quot;
              </text>
              <text x="62" y="108" textAnchor="end" fontSize="9" fontFamily="JetBrains Mono, monospace" fill="#64748B">
                {formatLength(calc.screenWidthMeters, unit, 2)}
              </text>

              {/* Light cone */}
              <polygon points="80,38 80,152 570,101 570,89" fill="rgba(29, 78, 216, 0.12)" stroke="#1D4ED8" strokeWidth="1" strokeDasharray="4 3" />

              {/* Projector block */}
              <rect x="570" y="75" width="44" height="40" rx="4" fill="#0F172A" />
              <rect x="564" y="88" width="6" height="14" fill="#1D4ED8" />
              <text x="592" y="67" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="DM Sans, sans-serif" fill="#0F172A">
                PROJECTOR ({config.throwRatio.toFixed(2)}:1)
              </text>

              {/* Dimension ruler */}
              <line x1="80" y1="170" x2="570" y2="170" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="80" y1="164" x2="80" y2="176" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="570" y1="164" x2="570" y2="176" stroke="#0F172A" strokeWidth="1.2" />
              <text x="325" y="164" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace" fill="#0F172A">
                THROW DISTANCE: {formatLength(calc.throwDistanceMeters, unit, 2)} ({calc.throwDistanceMeters.toFixed(2)} m)
              </text>
            </svg>
          </div>
        </section>

        {/* India Environment & Power Engineering Notes */}
        <section className="print-break-inside-avoid">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            3. India Environment, Power &amp; Thermal Assessment
          </h3>
          <div className="text-xs text-slate-700 mb-2">
            Room Light: <strong className="text-slate-900">{config.lightIntensity.replace('_', ' ')}</strong> · Surface:{' '}
            <strong className="text-slate-900">{config.surfaceFinish.replace(/_/g, ' ')}</strong> · Heat:{' '}
            <strong className="text-slate-900">{config.indiaHeat.replace(/_/g, ' ')}</strong> · Humidity:{' '}
            <strong className="text-slate-900">{config.indiaHumidity.replace(/_/g, ' ')}</strong> · Power:{' '}
            <strong className="text-slate-900">{config.indiaPower.replace(/_/g, ' ')}</strong> (Min UPS: {calc.recommendedUpsVa} VA)
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 border border-slate-200 rounded-lg p-3.5">
            {calc.indiaAdvisories.map((a, i) => (
              <li key={i}>
                <strong className="text-slate-900">{a.title}:</strong> {a.detail}
              </li>
            ))}
          </ul>
          {config.notes && (
            <div className="mt-2.5 p-3 border border-slate-200 rounded-lg text-xs text-slate-700">
              <strong className="text-slate-900">Installer Site Notes:</strong> {config.notes}
            </div>
          )}
        </section>

        {/* Shortlisted India Projector Recommendations */}
        <section className="print-break-inside-avoid">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            4. Recommended Projectors Available in India
          </h3>
          <table className="w-full text-left border-collapse border border-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-2.5">Model</th>
                <th className="p-2.5">Throw Range</th>
                <th className="p-2.5 text-right">ISO Lumens / fL</th>
                <th className="p-2.5">India Warranty</th>
                <th className="p-2.5 text-right">Est. India Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {top3.map((rec) => (
                <tr key={rec.model.id}>
                  <td className="p-2.5">
                    <div className="font-semibold text-slate-900">
                      {rec.model.brand} {rec.model.model}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {rec.model.nativeResolution} · {rec.model.lightSource}
                    </div>
                  </td>
                  <td className="p-2.5 font-mono tabular-nums text-slate-700">
                    {formatLength(rec.requiredThrowMinMeters, unit, 2)}
                    {rec.requiredThrowMaxMeters > rec.requiredThrowMinMeters
                      ? `–${formatLength(rec.requiredThrowMaxMeters, unit, 2)}`
                      : ''}
                  </td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-slate-900">
                    {rec.model.isoLumens.toLocaleString('en-IN')} lm ({rec.projectedFootLamberts} fL)
                  </td>
                  <td className="p-2.5 text-slate-700">{rec.model.warrantyIndia}</td>
                  <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-900">
                    {formatInr(rec.lowestPriceInr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Optional Quote Bag BOQ Section */}
        {cartItems.length > 0 && (
          <section className="print-break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              5. Equipment Bill of Quantities (Incl. 18% India GST)
            </h3>
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5">Retailer</th>
                  <th className="p-2.5 text-right">Qty</th>
                  <th className="p-2.5 text-right">Line Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cartItems.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2.5 font-medium text-slate-900">{item.title}</td>
                    <td className="p-2.5 text-slate-600">{item.preferredRetailer}</td>
                    <td className="p-2.5 text-right font-mono tabular-nums">{item.quantity}</td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-semibold">
                      {formatInr(item.unitPriceInr * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 flex justify-end text-xs font-mono tabular-nums text-slate-700 gap-6">
              <span>Base: {formatInr(boqSummary.subtotalExclGstInr)}</span>
              <span>GST (18%): {formatInr(boqSummary.gstAmountInr)}</span>
              <span className="font-bold text-slate-900">
                Grand Total: {formatInr(boqSummary.grandTotalInclGstInr)}
              </span>
            </div>
          </section>
        )}

        <footer className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Generated offline by IbexProjectorsIndia</span>
          <span>https://projectorguideindia.substack.com/</span>
        </footer>
      </article>
    </div>
  );
};

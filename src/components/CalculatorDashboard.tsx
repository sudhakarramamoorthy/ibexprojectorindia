import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  FileText,
  Info,
  RotateCcw,
  Save,
  Scale,
  ShoppingBag,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import { useApp, getSuggestedTargetPrice } from '../context/AppContext';
import {
  AmbientLighting,
  AspectRatio,
  IndiaHeatCondition,
  IndiaHumidityCondition,
  IndiaPowerCondition,
  LightIntensity,
  MountingType,
  ProjectorPurpose,
  SurfaceFinish,
} from '../types/projector';
import {
  calculateOptics,
  formatInr,
  formatLength,
  formatLengthNumeric,
  scoreProjectorsForConfig,
  toMeters,
} from '../utils/optics';
import { InteractiveThrowCanvas } from './InteractiveThrowCanvas';

export const CalculatorDashboard: React.FC = () => {
  const {
    t,
    unit,
    setUnit,
    config,
    updateConfig,
    resetConfig,
    savedConfigs,
    saveCurrentConfig,
    loadSavedConfig,
    deleteSavedConfig,
    openProductPage,
    compareIds,
    toggleCompareModel,
    addOrUpdatePriceWatch,
    addToCart,
    setActiveView,
    products,
  } = useApp();

  const [saveName, setSaveName] = useState(config.name);
  const [showSaveBar, setShowSaveBar] = useState(false);

  const calc = useMemo(() => calculateOptics(config), [config]);
  const ranked = useMemo(
    () => scoreProjectorsForConfig(products, config, calc),
    [products, config, calc]
  );

  const topRecommendations = ranked.slice(0, 6);

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCurrentConfig(saveName || config.name);
    setShowSaveBar(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Action Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            {t.calcHeadline}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{t.calcSubhead}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Unit Segmented Control */}
          <div className="flex items-center p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setUnit('ft')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                unit === 'ft' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Feet (ft)
            </button>
            <button
              type="button"
              onClick={() => setUnit('m')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                unit === 'm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Meters (m)
            </button>
          </div>

          <button
            type="button"
            onClick={resetConfig}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSaveName(config.name);
              setShowSaveBar((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5 text-blue-700" />
            <span>{t.saveConfiguration}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('report')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.generatePdfReport}</span>
          </button>
        </div>
      </div>

      {/* Inline Save Configuration Bar */}
      {showSaveBar && (
        <form
          onSubmit={handleSaveSubmit}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            maxLength={120}
            placeholder="Configuration name (e.g., Master Bedroom 100-inch)"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <input
            type="text"
            value={config.projectLocation}
            onChange={(e) => updateConfig({ projectLocation: e.target.value })}
            maxLength={120}
            placeholder="City / Site (e.g., Pune, MH)"
            className="sm:w-56 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap"
            >
              Confirm Save
            </button>
            <button
              type="button"
              onClick={() => setShowSaveBar(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Full-Width 4-Column Optical KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">{t.throwDistance}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatLength(calc.throwDistanceMeters, unit, 2)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            Ratio {calc.throwRatio.toFixed(2)}:1 · {unit === 'ft' ? `${calc.throwDistanceMeters.toFixed(2)} m` : `${calc.throwDistanceFeet.toFixed(2)} ft`}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">{t.screenDiagonal}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {Math.round(calc.screenDiagonalInches)}&quot;
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {formatLength(calc.screenWidthMeters, unit, 2)} × {formatLength(calc.screenHeightMeters, unit, 2)} · {config.aspectRatio}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">{t.requiredBrightness}</div>
          <div className="mt-1 text-2xl font-bold text-blue-700 font-mono tabular-nums">
            {calc.recommendedMinIsoLumens.toLocaleString('en-IN')}+ lm
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            Ideal {calc.recommendedIdealIsoLumens.toLocaleString('en-IN')} ISO lm · Gain {calc.surfaceGain}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">{t.seatingRange} &amp; {t.recommendedUps}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatLength(calc.seatingDistanceMinMeters, unit, 1)}–{formatLength(calc.seatingDistanceMaxMeters, unit, 1)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            UPS {calc.recommendedUpsVa} VA Pure Sine Wave
          </div>
        </div>
      </div>

      {/* Main Optical Calibration Workspace: Canvas (Left 7 cols) + Precision Sliders (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7">
          <InteractiveThrowCanvas
            config={config}
            calc={calc}
            unit={unit}
            dragHint={t.dragHint}
            onChange={updateConfig}
          />
        </div>

        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Precision Optical Inputs</h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              D = TR × W
            </span>
          </div>

          {/* Throw Ratio */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="throw-ratio-input" className="font-medium text-slate-700">
                {t.throwRatio} (Lens)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="throw-ratio-input"
                  type="number"
                  step="0.02"
                  min="0.16"
                  max="3.2"
                  value={Number(config.throwRatio.toFixed(2))}
                  onChange={(e) =>
                    updateConfig({
                      throwRatio: Math.max(0.16, Math.min(3.2, parseFloat(e.target.value) || 0.16)),
                    })
                  }
                  className="w-20 px-2 py-1 text-right font-mono tabular-nums text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-slate-500 font-mono">:1</span>
              </div>
            </div>
            <input
              type="range"
              min="0.16"
              max="2.8"
              step="0.01"
              value={config.throwRatio}
              onChange={(e) => updateConfig({ throwRatio: parseFloat(e.target.value) })}
              className="w-full optic-slider"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0.16 UST</span>
              <span>0.70 Short</span>
              <span>1.30 Std</span>
              <span>2.80 Tele</span>
            </div>
          </div>

          {/* Screen Width */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="screen-width-input" className="font-medium text-slate-700">
                {t.screenWidth} ({unit})
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="screen-width-input"
                  type="number"
                  step="0.1"
                  min={unit === 'ft' ? 3.3 : 1.0}
                  max={unit === 'ft' ? 16.4 : 5.0}
                  value={formatLengthNumeric(config.screenWidthMeters, unit, 2)}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!Number.isNaN(num)) {
                      updateConfig({ screenWidthMeters: Math.max(1.0, Math.min(5.0, toMeters(num, unit))) });
                    }
                  }}
                  className="w-20 px-2 py-1 text-right font-mono tabular-nums text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-slate-500 font-mono">{unit}</span>
              </div>
            </div>
            <input
              type="range"
              min="1.1"
              max="4.6"
              step="0.02"
              value={config.screenWidthMeters}
              onChange={(e) => updateConfig({ screenWidthMeters: parseFloat(e.target.value) })}
              className="w-full optic-slider"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-400 font-mono">
              <span>55&quot;</span>
              <span>100&quot;</span>
              <span>120&quot;</span>
              <span>150&quot;</span>
              <span>200&quot;</span>
            </div>
          </div>

          {/* Throw Distance Direct Override */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="throw-dist-input" className="font-medium text-slate-700">
                {t.throwDistance} ({unit})
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="throw-dist-input"
                  type="number"
                  step="0.1"
                  min={unit === 'ft' ? 0.6 : 0.2}
                  max={unit === 'ft' ? 35 : 11}
                  value={formatLengthNumeric(calc.throwDistanceMeters, unit, 2)}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!Number.isNaN(num)) {
                      updateConfig({ throwDistanceMeters: Math.max(0.2, Math.min(11, toMeters(num, unit))) });
                    }
                  }}
                  className="w-20 px-2 py-1 text-right font-mono tabular-nums text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-slate-500 font-mono">{unit}</span>
              </div>
            </div>
            <input
              type="range"
              min="0.25"
              max="8.5"
              step="0.05"
              value={Math.min(8.5, calc.throwDistanceMeters)}
              onChange={(e) => updateConfig({ throwDistanceMeters: parseFloat(e.target.value) })}
              className="w-full optic-slider"
            />
          </div>

          {/* Aspect Ratio & Mounting Type */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {t.aspectRatio}
              </label>
              <select
                value={config.aspectRatio}
                onChange={(e) => updateConfig({ aspectRatio: e.target.value as AspectRatio })}
                className="w-full px-2.5 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="16:9">16:9 (HD / 4K Cinema)</option>
                <option value="2.35:1">2.35:1 (Anamorphic Scope)</option>
                <option value="16:10">16:10 (WUXGA Office)</option>
                <option value="4:3">4:3 (Classic)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Mount Placement
              </label>
              <select
                value={config.mountingType}
                onChange={(e) => updateConfig({ mountingType: e.target.value as MountingType })}
                className="w-full px-2.5 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ceiling">Ceiling Mount</option>
                <option value="table">Coffee Table / Stand</option>
                <option value="shelf">Rear Wall Shelf</option>
                <option value="ust_console">UST Media Console</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Room Environment Questionnaire & India Climate Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Lighting, Surface & Primary Purpose */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">{t.roomLightingSection}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tunes ISO lumen requirements, screen gain compensation, and input-lag priority.
            </p>
          </div>

          {/* Light Intensity */}
          <div>
            <div className="text-xs font-medium text-slate-700 mb-2">{t.lightIntensityLabel}</div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'dark', label: t.lightDark },
                  { id: 'semi_lit', label: t.lightSemiLit },
                  { id: 'bright', label: t.lightBright },
                ] as { id: LightIntensity; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig({ lightIntensity: opt.id })}
                  className={`px-2.5 py-2 text-xs font-medium rounded-md transition-colors truncate ${
                    config.lightIntensity === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ambient Light Source */}
          <div>
            <div className="text-xs font-medium text-slate-700 mb-2">{t.ambientSourceLabel}</div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'blackout', label: 'Blackout Curtains / No Windows' },
                  { id: 'curtains', label: 'Sheer / Standard Curtains' },
                  { id: 'daylight_windows', label: 'Direct Indian Daylight Windows' },
                  { id: 'overhead_led', label: 'Overhead Warm/Cool LEDs On' },
                ] as { id: AmbientLighting; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig({ ambientLighting: opt.id })}
                  className={`text-left px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    config.ambientLighting === opt.id
                      ? 'border-blue-700 bg-blue-50/70 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Surface Finish */}
          <div>
            <div className="text-xs font-medium text-slate-700 mb-2">{t.surfaceFinishLabel}</div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'matte_white', label: 'Matte White Screen (1.1 Gain)' },
                  { id: 'high_contrast_grey', label: 'High-Contrast Grey (0.82 Gain)' },
                  { id: 'alr_clr', label: 'ALR / CLR Ambient Rejecting' },
                  { id: 'painted_wall', label: 'Matte Painted Wall (Asian/Dulux)' },
                ] as { id: SurfaceFinish; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig({ surfaceFinish: opt.id })}
                  className={`text-left px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    config.surfaceFinish === opt.id
                      ? 'border-blue-700 bg-blue-50/70 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Purpose */}
          <div>
            <div className="text-xs font-medium text-slate-700 mb-2">{t.primaryPurposeLabel}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'cinema', label: t.purposeCinema },
                  { id: 'gaming', label: t.purposeGaming },
                  { id: 'casual', label: t.purposeCasual },
                  { id: 'all', label: t.purposeAll },
                ] as { id: ProjectorPurpose; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig({ purpose: opt.id })}
                  className={`px-2 py-2 text-xs font-medium rounded-md transition-colors truncate ${
                    config.purpose === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right: India-Specific Heat, Humidity & Voltage Stability */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">{t.indiaConditionsSection}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calibrates optical engine sealing, thermal tolerance, and Pure Sine Wave UPS sizing for Indian homes.
            </p>
          </div>

          {/* Heat / AC */}
          <div>
            <div className="text-xs font-medium text-slate-700 mb-2">{t.heatLabel}</div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'ac_controlled', label: 'AC Room (22–26°C)' },
                  { id: 'moderate_fan', label: 'Ceiling Fan (28–35°C)' },
                  { id: 'high_heat_non_ac', label: 'Peak Summer (38°C+)' },
                ] as { id: IndiaHeatCondition; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig({ indiaHeat: opt.id })}
                  className={`px-2 py-2 text-xs font-medium rounded-md transition-colors truncate ${
                    config.indiaHeat === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Humidity & Dust */}
          <div>
            <div className="text-xs font-medium text-slate-700 mb-2">{t.humidityLabel}</div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'moderate', label: 'Moderate Inland' },
                  { id: 'coastal_monsoon', label: 'Coastal / Monsoon RH' },
                  { id: 'dry_dusty', label: 'Dry / Urban Dust' },
                ] as { id: IndiaHumidityCondition; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig({ indiaHumidity: opt.id })}
                  className={`px-2 py-2 text-xs font-medium rounded-md transition-colors truncate ${
                    config.indiaHumidity === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Power Stability */}
          <div>
            <div className="text-xs font-medium text-slate-700 mb-2">{t.powerLabel}</div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'online_ups', label: 'Online UPS / Stable' },
                  { id: 'inverter_backup', label: 'Home Inverter Backup' },
                  { id: 'frequent_fluctuation', label: 'Voltage Fluctuations' },
                ] as { id: IndiaPowerCondition; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig({ indiaPower: opt.id })}
                  className={`px-2 py-2 text-xs font-medium rounded-md transition-colors truncate ${
                    config.indiaPower === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live India Engineering Advisories (No thick left borders, clean hairline cards) */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            {calc.indiaAdvisories.map((adv, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2.5"
              >
                {adv.severity === 'alert' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                ) : adv.severity === 'caution' ? (
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>{adv.title}</span>
                    <span
                      className={`text-[11px] font-medium ${
                        adv.severity === 'alert'
                          ? 'text-red-700'
                          : adv.severity === 'caution'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      · {adv.severity === 'alert' ? 'Action Required' : adv.severity === 'caution' ? 'Advisory' : 'Optimal'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{adv.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recommended Projectors in India (Ranked Live) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t.recommendedModelsTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked dynamically for {formatLength(calc.throwDistanceMeters, unit, 2)} throw ·{' '}
              {Math.round(calc.screenDiagonalInches)}&quot; screen ·{' '}
              {calc.recommendedMinIsoLumens.toLocaleString('en-IN')}+ ISO lm target · India climate &amp; power profile
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
          >
            <span>Browse all {products.length} India models</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {topRecommendations.map((rec) => {
            const isComparing = compareIds.includes(rec.model.id);
            return (
              <article
                key={rec.model.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    <img
                      src={rec.model.imageUrl}
                      alt={`${rec.model.brand} ${rec.model.model}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-slate-700">{rec.model.brand}</span>
                        <span aria-hidden="true">·</span>
                        <span>{rec.model.categoryLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            rec.throwFit === 'exact'
                              ? 'text-emerald-700 font-medium'
                              : rec.throwFit === 'adjustable'
                              ? 'text-amber-700 font-medium'
                              : 'text-slate-500'
                          }
                        >
                          {rec.throwFit === 'exact'
                            ? 'Exact Throw Match'
                            : rec.throwFit === 'adjustable'
                            ? 'Adjustable Throw'
                            : 'Different Lens Range'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProductPage(rec.model.id)}
                        className="mt-1 text-left text-base font-bold text-slate-900 hover:text-blue-700 transition-colors block"
                      >
                        {rec.model.brand} {rec.model.model}
                      </button>
                    </div>

                    {/* Key Optical Specs Row */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 text-xs">
                      <div>
                        <div className="text-slate-400 text-[11px]">Throw Ratio</div>
                        <div className="font-mono tabular-nums font-semibold text-slate-900">
                          {rec.model.throwRatioMin === rec.model.throwRatioMax
                            ? `${rec.model.throwRatioMin}:1`
                            : `${rec.model.throwRatioMin}–${rec.model.throwRatioMax}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">ISO Lumens</div>
                        <div className="font-mono tabular-nums font-semibold text-slate-900">
                          {rec.model.isoLumens.toLocaleString('en-IN')} lm
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Est. Screen</div>
                        <div
                          className={`font-mono tabular-nums font-semibold ${
                            rec.brightnessVerdict === 'Optimal'
                              ? 'text-emerald-700'
                              : rec.brightnessVerdict === 'Adequate'
                              ? 'text-slate-900'
                              : 'text-amber-700'
                          }`}
                        >
                          {rec.projectedFootLamberts} fL
                        </div>
                      </div>
                    </div>

                    {/* Reasons & Cautions */}
                    <ul className="space-y-1 text-xs text-slate-600">
                      {rec.reasons.slice(0, 2).map((r, i) => (
                        <li key={i} className="leading-snug">
                          • {r}
                        </li>
                      ))}
                      {rec.cautions[0] && (
                        <li className="leading-snug text-amber-700">• Note: {rec.cautions[0]}</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Price & Actions Footer */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200/80 space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                        {formatInr(rec.lowestPriceInr)}
                      </span>
                      <span className="ml-1.5 text-[11px] text-slate-500">
                        at {rec.lowestRetailer}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {rec.model.lightSource}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openProductPage(rec.model.id)}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {t.viewDetails}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCompareModel(rec.model.id)}
                      title={t.compareSpec}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                        isComparing
                          ? 'border-blue-700 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5 inline mr-1" />
                      {isComparing ? 'Added' : t.compareSpec}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addOrUpdatePriceWatch(
                          rec.model.id,
                          getSuggestedTargetPrice(rec.model.id),
                          `Matched ${config.name}`
                        )
                      }
                      title={t.trackPrice}
                      aria-label={`Track price for ${rec.model.brand} ${rec.model.model}`}
                      className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:text-blue-700 hover:border-blue-300 rounded-lg transition-colors"
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          skuId: rec.model.id,
                          itemType: 'projector',
                          title: `${rec.model.brand} ${rec.model.model}`,
                          unitPriceInr: rec.lowestPriceInr,
                          preferredRetailer: rec.lowestRetailer,
                        })
                      }
                      title={t.addToQuoteBag}
                      aria-label={`Add ${rec.model.brand} ${rec.model.model} to quote bag`}
                      className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:text-blue-700 hover:border-blue-300 rounded-lg transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Saved Cloud / Offline Room Configurations */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Saved Room Calibrations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Stored offline on this device and automatically cloud-synced when signed in.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {savedConfigs.length} saved
          </span>
        </div>

        {savedConfigs.length === 0 ? (
          <div className="py-8 text-center">
            <Bookmark className="w-5 h-5 text-slate-400 mx-auto" />
            <p className="mt-2 text-sm font-medium text-slate-700">No saved setups yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Click &quot;{t.saveConfiguration}&quot; above to save your current room throw calibration for client reports or future comparison.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-2">
            {savedConfigs.map((sc) => (
              <div
                key={sc.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{sc.name}</div>
                  <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    Throw {formatLength(sc.throwDistanceMeters, unit, 2)} · Ratio {sc.throwRatio.toFixed(2)}:1 · Width{' '}
                    {formatLength(sc.screenWidthMeters, unit, 2)} · {sc.projectLocation || 'India'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => loadSavedConfig(sc)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Load Calibration
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSavedConfig(sc.id)}
                    aria-label={`Delete ${sc.name}`}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

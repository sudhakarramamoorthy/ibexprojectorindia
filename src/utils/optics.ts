import {
  AspectRatio,
  OpticalCalculationResult,
  ProjectorModel,
  RankedRecommendation,
  RoomConfiguration,
  SurfaceFinish,
  UnitSystem,
} from '../types/projector';

export const METERS_TO_FEET = 3.28084;
export const METERS_TO_INCHES = 39.3701;

export function getAspectRatioNumeric(aspect: AspectRatio): number {
  switch (aspect) {
    case '16:9':
      return 16 / 9;
    case '16:10':
      return 16 / 10;
    case '2.35:1':
      return 2.35;
    case '4:3':
      return 4 / 3;
  }
}

export function getSurfaceGain(surface: SurfaceFinish): {
  gain: number;
  ambientRejectionFactor: number;
  label: string;
} {
  switch (surface) {
    case 'matte_white':
      return { gain: 1.1, ambientRejectionFactor: 1.0, label: 'Matte White (1.1 Gain)' };
    case 'high_contrast_grey':
      return { gain: 0.82, ambientRejectionFactor: 1.2, label: 'High-Contrast Grey (0.82 Gain)' };
    case 'alr_clr':
      return { gain: 0.78, ambientRejectionFactor: 1.65, label: 'ALR / CLR Screen (0.78 Gain)' };
    case 'painted_wall':
      return { gain: 0.85, ambientRejectionFactor: 0.9, label: 'Matte Painted Wall (0.85 Gain)' };
  }
}

export function formatLength(meters: number, unit: UnitSystem, decimals = 2): string {
  if (unit === 'ft') {
    return `${(meters * METERS_TO_FEET).toFixed(decimals)} ft`;
  }
  return `${meters.toFixed(decimals)} m`;
}

export function formatLengthNumeric(meters: number, unit: UnitSystem, decimals = 2): number {
  const val = unit === 'ft' ? meters * METERS_TO_FEET : meters;
  return Number(val.toFixed(decimals));
}

export function toMeters(value: number, unit: UnitSystem): number {
  return unit === 'ft' ? value / METERS_TO_FEET : value;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getLowestListing(model: ProjectorModel) {
  const inStockListings = model.listings.filter((l) => l.inStock);
  const pool = inStockListings.length > 0 ? inStockListings : model.listings;
  return pool.reduce((best, curr) => (curr.priceInr < best.priceInr ? curr : best), pool[0]);
}

export function getModelPriceTier(
  model: ProjectorModel
): 'budget' | 'premium' | 'luxury' | 'ultra-luxury' {
  const lowest = getLowestListing(model).priceInr;
  if (lowest < 115000) return 'budget';
  if (lowest < 200000) return 'premium';
  if (lowest < 350000) return 'luxury';
  return 'ultra-luxury';
}

export function getPriceTierLabel(
  tier: 'budget' | 'premium' | 'luxury' | 'ultra-luxury'
): string {
  switch (tier) {
    case 'budget':
      return 'Budget';
    case 'premium':
      return 'Premium';
    case 'luxury':
      return 'Luxury';
    case 'ultra-luxury':
      return 'Ultra Luxury';
  }
}

export function matchesUseCase(
  model: ProjectorModel,
  useCase: 'ALL' | 'home-entertainment' | 'training-education' | 'house-of-god' | 'events'
): boolean {
  if (useCase === 'ALL') return true;
  switch (useCase) {
    case 'home-entertainment':
      return model.bestFor.includes('cinema') || model.bestFor.includes('gaming');
    case 'training-education':
      return (
        model.isoLumens >= 2200 &&
        (model.category === 'standard' || model.category === 'short_throw')
      );
    case 'house-of-god':
      return (
        model.isoLumens >= 2650 &&
        (model.lightSource === 'Laser' ||
          model.lightSource === 'Tri-Laser' ||
          model.lightSource === '4LED' ||
          model.isoLumens >= 3000)
      );
    case 'events':
      return model.category === 'portable' || model.isoLumens >= 2800;
  }
}

export function calculateOptics(config: RoomConfiguration): OpticalCalculationResult {
  const ratioNum = getAspectRatioNumeric(config.aspectRatio);
  const screenWidthMeters = Math.max(0.6, Math.min(10, config.screenWidthMeters));
  const screenHeightMeters = screenWidthMeters / ratioNum;
  const screenDiagonalMeters = Math.sqrt(
    screenWidthMeters * screenWidthMeters + screenHeightMeters * screenHeightMeters
  );
  const screenDiagonalInches = screenDiagonalMeters * METERS_TO_INCHES;
  const screenAreaSqMeters = screenWidthMeters * screenHeightMeters;
  const screenAreaSqFeet = screenAreaSqMeters * 10.7639;

  const throwRatio = Math.max(0.18, Math.min(4.0, config.throwRatio));
  const throwDistanceMeters = screenWidthMeters * throwRatio;
  const throwDistanceFeet = throwDistanceMeters * METERS_TO_FEET;

  const surfaceInfo = getSurfaceGain(config.surfaceFinish);

  // Target Foot-Lamberts based on lighting & ambient source
  let targetMinFl = 16; // Dedicated dark home cinema (SMPTE 14-16 fL)
  let targetIdealFl = 24;

  if (config.lightIntensity === 'semi_lit') {
    targetMinFl = 28;
    targetIdealFl = 42;
  } else if (config.lightIntensity === 'bright') {
    targetMinFl = 48;
    targetIdealFl = 68;
  }

  // Ambient lighting modifier
  if (config.ambientLighting === 'daylight_windows') {
    targetMinFl *= 1.18;
    targetIdealFl *= 1.22;
  } else if (config.ambientLighting === 'overhead_led') {
    targetMinFl *= 1.12;
    targetIdealFl *= 1.15;
  } else if (config.ambientLighting === 'blackout') {
    targetMinFl *= 0.92;
  }

  // ALR / CLR screens dramatically reduce required raw lumens in lit rooms
  const effectiveAmbientDivisor =
    config.lightIntensity === 'dark' ? 1.0 : surfaceInfo.ambientRejectionFactor;

  const recommendedMinIsoLumens = Math.round(
    ((targetMinFl * screenAreaSqFeet) / (surfaceInfo.gain * effectiveAmbientDivisor) / 100) * 100
  );
  const recommendedIdealIsoLumens = Math.round(
    ((targetIdealFl * screenAreaSqFeet) / (surfaceInfo.gain * effectiveAmbientDivisor) / 100) * 100
  );

  // THX / SMPTE comfortable viewing distance (1.2x to 1.8x screen width for 4K/cinema)
  const seatingDistanceMinMeters = screenWidthMeters * 1.2;
  const seatingDistanceMaxMeters = screenWidthMeters * 1.85;

  // India-specific UPS sizing and environmental advisories
  const indiaAdvisories: OpticalCalculationResult['indiaAdvisories'] = [];

  let recommendedUpsVa = 600;
  if (config.indiaPower === 'frequent_fluctuation') {
    recommendedUpsVa = 1500;
    indiaAdvisories.push({
      title: 'Online Double-Conversion UPS (1.5 kVA) Recommended',
      severity: 'alert',
      detail:
        'Frequent Indian grid voltage sags (160V–265V) and switchover gaps can crack hot UHP lamps. Prefer solid-state Laser/LED projectors or pair with a Pure Sine Wave Online UPS (APC / Microtek / Luminous).',
    });
  } else if (config.indiaPower === 'inverter_backup') {
    recommendedUpsVa = 1000;
    indiaAdvisories.push({
      title: 'Check Home Inverter UPS-Mode Switchover Time',
      severity: 'caution',
      detail:
        'Standard home inverters have a 15–25ms transfer delay that resets lamp projectors. Enable UPS mode on your inverter or add a dedicated 1 kVA Pure Sine Wave UPS for the projector ceiling drop.',
    });
  } else {
    recommendedUpsVa = 600;
    indiaAdvisories.push({
      title: 'Clean Power Infrastructure Verified',
      severity: 'nominal',
      detail:
        'Online UPS / stabilized line allows full support for both high-output UHP lamp and laser projectors with safe thermal cool-down cycles.',
    });
  }

  if (config.indiaHeat === 'high_heat_non_ac') {
    indiaAdvisories.push({
      title: 'High Summer Thermal Load (38°C–44°C Ambient)',
      severity: 'alert',
      detail:
        'Maintain at least 40 cm exhaust clearance around vents. Prioritize Laser or 4LED projectors rated up to 40°C+ ambient with automated high-altitude/high-temp fan profiles.',
    });
  } else if (config.indiaHeat === 'moderate_fan') {
    indiaAdvisories.push({
      title: 'Ceiling Fan Placement & Thermal Airflow Check',
      severity: 'caution',
      detail:
        'Ensure ceiling mount drop rod clears ceiling fan blades and prevents light-beam flicker. Leave 30 cm clearance around intake/exhaust louvers.',
    });
  } else {
    indiaAdvisories.push({
      title: 'AC-Controlled Thermal Envelope',
      severity: 'nominal',
      detail:
        'Stable 22°C–26°C room temperature extends phosphor wheel, laser diode, and lamp lifespan while keeping fan acoustics in whisper mode.',
    });
  }

  if (config.indiaHumidity === 'coastal_monsoon') {
    indiaAdvisories.push({
      title: 'Coastal & Monsoon Fungal/Condensation Protection',
      severity: 'caution',
      detail:
        'High RH (>75% in Mumbai, Chennai, Kochi, Kolkata) risks optical lens fungus and dust clumping. Choose IP5X sealed optical engines and run the projector 30 mins weekly during monsoon.',
    });
  } else if (config.indiaHumidity === 'dry_dusty') {
    indiaAdvisories.push({
      title: 'High Particulate Dust Mitigation',
      severity: 'caution',
      detail:
        'Fine urban/construction dust degrades contrast and causes yellow spots on open 3LCD/LCD panels. Prioritize sealed DLP/Laser engines or cleanable electrostatic dust filters every 60 days.',
    });
  }

  if (config.lightIntensity !== 'dark' && config.surfaceFinish === 'matte_white') {
    indiaAdvisories.push({
      title: 'Ambient Light Washout Notice',
      severity: 'caution',
      detail:
        'Matte White screens reflect room light equally in all directions. For semi-lit or bright Indian living rooms, upgrading to a High-Contrast Grey or ALR/CLR screen doubles perceived black levels.',
    });
  }

  return {
    screenWidthMeters,
    screenHeightMeters,
    screenDiagonalMeters,
    screenDiagonalInches,
    screenAreaSqMeters,
    screenAreaSqFeet,
    throwDistanceMeters,
    throwDistanceFeet,
    throwRatio,
    surfaceGain: surfaceInfo.gain,
    recommendedMinIsoLumens: Math.max(600, recommendedMinIsoLumens),
    recommendedIdealIsoLumens: Math.max(1000, recommendedIdealIsoLumens),
    seatingDistanceMinMeters,
    seatingDistanceMaxMeters,
    recommendedUpsVa,
    indiaAdvisories,
  };
}

export function scoreProjectorsForConfig(
  models: ProjectorModel[],
  config: RoomConfiguration,
  calc: OpticalCalculationResult
): RankedRecommendation[] {
  return models
    .map((model) => {
      let score = 0;
      const reasons: string[] = [];
      const cautions: string[] = [];

      const requiredThrowMinMeters = calc.screenWidthMeters * model.throwRatioMin;
      const requiredThrowMaxMeters = calc.screenWidthMeters * model.throwRatioMax;

      // 1. Throw ratio / distance fit (35 pts)
      let throwFit: 'exact' | 'adjustable' | 'out_of_range' = 'out_of_range';
      const targetRatio = config.throwRatio;
      if (targetRatio >= model.throwRatioMin && targetRatio <= model.throwRatioMax) {
        throwFit = 'exact';
        score += 35;
        reasons.push(
          `Exact optical match for ${targetRatio.toFixed(2)}:1 throw ratio (${model.throwRatioMin}–${model.throwRatioMax}:1)`
        );
      } else {
        const distToRange = Math.min(
          Math.abs(targetRatio - model.throwRatioMin),
          Math.abs(targetRatio - model.throwRatioMax)
        );
        if (distToRange <= 0.35) {
          throwFit = 'adjustable';
          score += 22;
          cautions.push(
            `Requires slight mount shift to ${requiredThrowMinMeters.toFixed(2)}–${requiredThrowMaxMeters.toFixed(2)} m`
          );
        } else {
          throwFit = 'out_of_range';
          score += 5;
          cautions.push(
            `Lens range (${model.throwRatioMin}–${model.throwRatioMax}:1) differs from your ${targetRatio.toFixed(2)}:1 layout`
          );
        }
      }

      // 2. Brightness & Foot-Lamberts fit (25 pts)
      const projectedFootLamberts =
        (model.isoLumens * calc.surfaceGain) / Math.max(1, calc.screenAreaSqFeet);
      let brightnessVerdict: 'Optimal' | 'Adequate' | 'Dim for Room' = 'Adequate';

      if (model.isoLumens >= calc.recommendedIdealIsoLumens) {
        brightnessVerdict = 'Optimal';
        score += 25;
        reasons.push(
          `${model.isoLumens.toLocaleString('en-IN')} ISO lm delivers crisp ${projectedFootLamberts.toFixed(1)} fL for your room`
        );
      } else if (model.isoLumens >= calc.recommendedMinIsoLumens * 0.85) {
        brightnessVerdict = 'Adequate';
        score += 18;
        reasons.push(
          `${model.isoLumens.toLocaleString('en-IN')} ISO lm meets baseline brightness (${projectedFootLamberts.toFixed(1)} fL)`
        );
      } else {
        brightnessVerdict = 'Dim for Room';
        score += 6;
        cautions.push(
          `Below recommended ${calc.recommendedMinIsoLumens.toLocaleString('en-IN')} ISO lm for this screen & light level`
        );
      }

      // 3. Purpose alignment (20 pts)
      if (model.bestFor.includes(config.purpose)) {
        score += 20;
        if (config.purpose === 'gaming' && model.inputLagMs <= 17) {
          reasons.push(`Ultra-low ${model.inputLagMs} ms input lag at up to ${model.maxRefreshHz} Hz`);
        } else if (config.purpose === 'cinema') {
          reasons.push(`${model.nativeResolution} ${model.displayTech} with ${model.hdrSupport}`);
        } else {
          reasons.push(`Well-suited for ${config.purpose === 'all' ? 'hybrid gaming, movies & TV' : config.purpose}`);
        }
      } else if (config.purpose === 'all') {
        score += 14;
      } else {
        score += 8;
        if (config.purpose === 'gaming' && model.inputLagMs > 30) {
          cautions.push(`Higher input lag (${model.inputLagMs} ms) for competitive gaming`);
        }
      }

      // 4. India Climate, Dust & Power Resilience (20 pts)
      let indiaPts = 10;
      if (config.indiaPower === 'frequent_fluctuation' || config.indiaPower === 'inverter_backup') {
        if (model.indiaClimate.powerCutResilience === 'High (Solid-State)') {
          indiaPts += 5;
          reasons.push(`${model.lightSource} engine survives sudden Indian power cuts safely`);
        } else {
          indiaPts -= 3;
          cautions.push('UHP lamp requires Pure Sine Wave Online UPS during power cuts');
        }
      } else {
        indiaPts += 3;
      }

      if (config.indiaHeat === 'high_heat_non_ac') {
        if (model.indiaClimate.maxAmbientTempC >= 40) {
          indiaPts += 3;
          reasons.push(`Rated up to ${model.indiaClimate.maxAmbientTempC}°C Indian summer ambient`);
        } else {
          indiaPts -= 3;
          cautions.push(`Max rated ambient ${model.indiaClimate.maxAmbientTempC}°C — AC recommended`);
        }
      } else {
        indiaPts += 2;
      }

      if (config.indiaHumidity === 'coastal_monsoon' || config.indiaHumidity === 'dry_dusty') {
        if (model.indiaClimate.sealedOptics) {
          indiaPts += 2;
          reasons.push(`Sealed optical engine (${model.indiaClimate.dustProtection})`);
        } else {
          cautions.push(`Requires periodic filter maintenance (${model.indiaClimate.dustProtection})`);
        }
      }

      score += Math.max(0, Math.min(20, indiaPts));

      const lowest = getLowestListing(model);

      return {
        model,
        fitScore: Math.min(100, Math.round(score)),
        throwFit,
        requiredThrowMinMeters,
        requiredThrowMaxMeters,
        projectedFootLamberts: Number(projectedFootLamberts.toFixed(1)),
        brightnessVerdict,
        lowestPriceInr: lowest.priceInr,
        lowestRetailer: lowest.site,
        reasons: reasons.slice(0, 3),
        cautions: cautions.slice(0, 2),
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}

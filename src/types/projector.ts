export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'kn';

export type UnitSystem = 'ft' | 'm';

export type AspectRatio = '16:9' | '16:10' | '2.35:1' | '4:3';

export type LightIntensity = 'dark' | 'semi_lit' | 'bright';

export type AmbientLighting = 'blackout' | 'curtains' | 'daylight_windows' | 'overhead_led';

export type SurfaceFinish = 'matte_white' | 'high_contrast_grey' | 'alr_clr' | 'painted_wall';

export type ProjectorPurpose = 'cinema' | 'gaming' | 'casual' | 'all';

export type IndiaHeatCondition = 'ac_controlled' | 'moderate_fan' | 'high_heat_non_ac';

export type IndiaHumidityCondition = 'dry_dusty' | 'moderate' | 'coastal_monsoon';

export type IndiaPowerCondition = 'online_ups' | 'inverter_backup' | 'frequent_fluctuation';

export type MountingType = 'ceiling' | 'table' | 'shelf' | 'ust_console';

export type LensCategory = 'ust' | 'short_throw' | 'standard' | 'cinema_tele' | 'portable';

export type PriceTierFilter = 'ALL' | 'budget' | 'premium' | 'luxury' | 'ultra-luxury';

export type UseCaseFilter =
  | 'ALL'
  | 'home-entertainment'
  | 'training-education'
  | 'house-of-god'
  | 'events';

export type ActiveView =
  | 'home'
  | 'calculator'
  | 'catalog'
  | 'product'
  | 'compare'
  | 'tracker'
  | 'report'
  | 'assistant'
  | 'signup';

export interface LensPreset {
  id: string;
  name: string;
  category: LensCategory;
  throwRatioMin: number;
  throwRatioMax: number;
  defaultThrowRatio: number;
  typicalLensShift: string;
  summary: string;
}

export interface MarketplaceListing {
  site:
    | 'Amazon.in'
    | 'Flipkart'
    | 'Croma'
    | 'Reliance Digital'
    | 'Vijay Sales'
    | 'Brand India Store'
    | 'Ooberpad India'
    | 'AVShack India';
  priceInr: number;
  mrpInr: number;
  inStock: boolean;
  deliveryNote: string;
  warrantyVerified: boolean;
  url: string;
}

export interface PricePoint {
  month: string;
  priceInr: number;
}

export interface ProjectorModel {
  id: string;
  brand: string;
  model: string;
  category: LensCategory;
  categoryLabel: string;
  imageUrl: string;
  tagline: string;
  nativeResolution: string;
  displayTech: 'DLP' | '3LCD' | 'SXRD Laser';
  lightSource: 'Tri-Laser' | 'Laser' | '4LED' | 'Dual Light (Laser+LED)' | 'LED' | 'UHP Lamp';
  lightSourceLifeHours: number;
  isoLumens: number;
  ansiLumensRef: number;
  contrastRatio: string;
  throwRatioMin: number;
  throwRatioMax: number;
  opticalZoom: string;
  lensShift: string;
  lensDetails: string;
  interchangeableLens: boolean;
  inputLagMs: number;
  maxRefreshHz: number;
  hdrSupport: string;
  builtInAudio: string;
  smartOs: string;
  weightKg: number;
  powerWatts: number;
  warrantyIndia: string;
  serviceNetworkIndia: string;
  indiaClimate: {
    maxAmbientTempC: number;
    sealedOptics: boolean;
    dustProtection: string;
    humidityTolerance: 'High' | 'Moderate';
    powerCutResilience: 'High (Solid-State)' | 'Lamp-Sensitive (UPS Required)';
  };
  bestFor: ProjectorPurpose[];
  listings: MarketplaceListing[];
  priceHistory90d: PricePoint[];
}

export interface RoomConfiguration {
  name: string;
  clientName: string;
  projectLocation: string;
  throwRatio: number;
  screenWidthMeters: number;
  throwDistanceMeters: number;
  aspectRatio: AspectRatio;
  lightIntensity: LightIntensity;
  ambientLighting: AmbientLighting;
  surfaceFinish: SurfaceFinish;
  purpose: ProjectorPurpose;
  indiaHeat: IndiaHeatCondition;
  indiaHumidity: IndiaHumidityCondition;
  indiaPower: IndiaPowerCondition;
  mountingType: MountingType;
  lensPresetId: string;
  notes: string;
}

export interface SavedConfiguration extends RoomConfiguration {
  id: string;
  userId: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface PriceWatchItem {
  id: string;
  userId: string;
  modelId: string;
  targetPriceInr: number;
  alertEnabled: boolean;
  notes: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface OpticalCalculationResult {
  screenWidthMeters: number;
  screenHeightMeters: number;
  screenDiagonalMeters: number;
  screenDiagonalInches: number;
  screenAreaSqMeters: number;
  screenAreaSqFeet: number;
  throwDistanceMeters: number;
  throwDistanceFeet: number;
  throwRatio: number;
  surfaceGain: number;
  recommendedMinIsoLumens: number;
  recommendedIdealIsoLumens: number;
  seatingDistanceMinMeters: number;
  seatingDistanceMaxMeters: number;
  recommendedUpsVa: number;
  indiaAdvisories: {
    title: string;
    severity: 'nominal' | 'caution' | 'alert';
    detail: string;
  }[];
}

export interface RankedRecommendation {
  model: ProjectorModel;
  fitScore: number; // 0-100 internal sort metric
  throwFit: 'exact' | 'adjustable' | 'out_of_range';
  requiredThrowMinMeters: number;
  requiredThrowMaxMeters: number;
  projectedFootLamberts: number;
  brightnessVerdict: 'Optimal' | 'Adequate' | 'Dim for Room';
  lowestPriceInr: number;
  lowestRetailer: string;
  reasons: string[];
  cautions: string[];
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  city: string;
  primaryUseCase: Exclude<UseCaseFilter, 'ALL'>;
  budgetTier: Exclude<PriceTierFilter, 'ALL'>;
  signupCompleted: boolean;
  preferredLanguage: LanguageCode;
  preferredUnit: UnitSystem;
  newsletterSubscribed: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface SubstackArticle {
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

export interface ChatMessageRecord {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  articleTitle: string;
  articleUrl: string;
  mode: 'text' | 'voice';
  createdAtIso: string;
}


import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Database,
  ExternalLink,
  LogIn,
  LogOut,
  MessageSquare,
  Plus,
  Save,
  ShieldCheck,
  ShoppingBag,
  TrendingDown,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBSTACK_NEWSLETTER_URL } from '../data/projectorsIndia';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';
import {
  LanguageCode,
  LensCategory,
  MarketplaceListing,
  PriceTierFilter,
  ProjectorModel,
  UnitSystem,
  UseCaseFilter,
} from '../types/projector';
import { formatInr, getLowestListing } from '../utils/optics';

const USE_CASE_OPTIONS: { value: Exclude<UseCaseFilter, 'ALL'>; label: string }[] = [
  { value: 'home-entertainment', label: 'Home Entertainment & Cinema' },
  { value: 'training-education', label: 'Training & Education' },
  { value: 'house-of-god', label: 'House of God & Sanctuaries' },
  { value: 'events', label: 'Events & Venues' },
];

const BUDGET_OPTIONS: { value: Exclude<PriceTierFilter, 'ALL'>; label: string }[] = [
  { value: 'budget', label: 'Budget (Under ₹1.15L)' },
  { value: 'premium', label: 'Premium (₹1.15L – ₹2.0L)' },
  { value: 'luxury', label: 'Luxury (₹2.0L – ₹3.5L)' },
  { value: 'ultra-luxury', label: 'Ultra Luxury (Above ₹3.5L)' },
];

export const SignUpPage: React.FC = () => {
  const {
    user,
    userProfile,
    isAdmin,
    authLoading,
    signInWithGoogle,
    signOutUser,
    updateUserProfile,
    products,
    productsSource,
    seedProductsToDatabase,
    updateProductPriceInDatabase,
    addOrUpdateProductInDatabase,
    savedConfigs,
    priceWatches,
    cartItems,
    chatMessages,
    setActiveView,
    openProductPage,
    language,
    unit,
  } = useApp();

  // Onboarding Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [primaryUseCase, setPrimaryUseCase] =
    useState<Exclude<UseCaseFilter, 'ALL'>>('home-entertainment');
  const [budgetTier, setBudgetTier] = useState<Exclude<PriceTierFilter, 'ALL'>>('premium');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(language);
  const [preferredUnit, setPreferredUnit] = useState<UnitSystem>(unit);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedFlag, setProfileSavedFlag] = useState(false);

  // Admin Database Manager State
  const [seedingDb, setSeedingDb] = useState(false);
  const [selectedEditModelId, setSelectedEditModelId] = useState<string>(products[0]?.id || 'benq-x3100i');
  const [selectedSite, setSelectedSite] = useState<MarketplaceListing['site']>('Amazon.in');
  const [editPriceInr, setEditPriceInr] = useState<string>('');
  const [editMrpInr, setEditMrpInr] = useState<string>('');
  const [savingPrice, setSavingPrice] = useState(false);

  // Admin Add New Product State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newCategory, setNewCategory] = useState<LensCategory>('standard');
  const [newResolution, setNewResolution] = useState('4K UHD (3840x2160)');
  const [newLumens, setNewLumens] = useState('3000');
  const [newThrowMin, setNewThrowMin] = useState('1.15');
  const [newThrowMax, setNewThrowMax] = useState('1.50');
  const [newPriceInr, setNewPriceInr] = useState('145000');
  const [newMrpInr, setNewMrpInr] = useState('175000');
  const [newRetailer, setNewRetailer] = useState<MarketplaceListing['site']>('Amazon.in');
  const [newTagline, setNewTagline] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || user?.displayName || '');
      setCity(userProfile.city || '');
      setPrimaryUseCase(userProfile.primaryUseCase || 'home-entertainment');
      setBudgetTier(userProfile.budgetTier || 'premium');
      setPreferredLanguage(userProfile.preferredLanguage || language);
      setPreferredUnit(userProfile.preferredUnit || unit);
      setNewsletterSubscribed(userProfile.newsletterSubscribed);
    } else if (user) {
      setDisplayName(user.displayName || '');
      setPreferredLanguage(language);
      setPreferredUnit(unit);
    }
  }, [userProfile, user, language, unit]);

  const selectedEditModel = useMemo(
    () => products.find((p) => p.id === selectedEditModelId) || products[0],
    [products, selectedEditModelId]
  );

  useEffect(() => {
    if (!selectedEditModel) return;
    const match =
      selectedEditModel.listings.find((l) => l.site === selectedSite) ||
      selectedEditModel.listings[0];
    if (match) {
      if (match.site !== selectedSite) {
        setSelectedSite(match.site);
      }
      setEditPriceInr(String(match.priceInr));
      setEditMrpInr(String(match.mrpInr));
    }
  }, [selectedEditModel, selectedSite]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSavedFlag(false);
    try {
      await updateUserProfile({
        displayName: displayName.trim() || user?.displayName || 'Buyer',
        city: city.trim(),
        primaryUseCase,
        budgetTier,
        preferredLanguage,
        preferredUnit,
        newsletterSubscribed,
        signupCompleted: true,
      });
      setProfileSavedFlag(true);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSeedDatabase = async () => {
    setSeedingDb(true);
    try {
      await seedProductsToDatabase();
    } finally {
      setSeedingDb(false);
    }
  };

  const handleSaveLivePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditModel) return;
    const parsedPrice = Number(editPriceInr);
    const parsedMrp = Number(editMrpInr);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 1000) return;

    setSavingPrice(true);
    try {
      await updateProductPriceInDatabase(
        selectedEditModel.id,
        selectedSite,
        parsedPrice,
        Number.isFinite(parsedMrp) && parsedMrp >= parsedPrice ? parsedMrp : undefined
      );
    } finally {
      setSavingPrice(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim() || !newModel.trim()) return;

    const slug = `${newBrand}-${newModel}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64);

    const priceVal = Math.max(10000, Number(newPriceInr) || 125000);
    const mrpVal = Math.max(priceVal, Number(newMrpInr) || Math.round(priceVal * 1.18));
    const tMin = Math.max(0.15, Number(newThrowMin) || 1.15);
    const tMax = Math.max(tMin, Number(newThrowMax) || tMin);
    const lumensVal = Math.max(300, Number(newLumens) || 2500);

    const categoryLabelMap: Record<LensCategory, string> = {
      ust: 'Ultra-Short Throw Laser',
      short_throw: 'Short Throw',
      standard: 'Standard Throw',
      cinema_tele: 'Dedicated Cinema Telephoto',
      portable: 'Smart Portable',
    };

    const imageByCategory: Record<LensCategory, string> = {
      ust: '/src/assets/images/projector_ust_laser_1795409895474.jpg',
      short_throw: '/src/assets/images/projector_gaming_short_1795409894536.jpg',
      standard: '/src/assets/images/projector_livingroom_3lcd_1795409894761.jpg',
      cinema_tele: '/src/assets/images/projector_cinema_4k_1795409893518.jpg',
      portable: '/src/assets/images/projector_portable_led_1795409894504.jpg',
    };

    const modelPayload: ProjectorModel = {
      id: slug || `custom-${Date.now()}`,
      brand: newBrand.trim(),
      model: newModel.trim(),
      category: newCategory,
      categoryLabel: categoryLabelMap[newCategory],
      imageUrl: imageByCategory[newCategory],
      tagline:
        newTagline.trim() ||
        `${newResolution.trim()} ${categoryLabelMap[newCategory]} calibrated for Indian rooms.`,
      nativeResolution: newResolution.trim() || '4K UHD (3840x2160)',
      displayTech: newBrand.trim().toLowerCase() === 'epson' ? '3LCD' : 'DLP',
      lightSource: 'Laser',
      lightSourceLifeHours: 20000,
      isoLumens: lumensVal,
      ansiLumensRef: lumensVal,
      contrastRatio: '150,000:1 Dynamic',
      throwRatioMin: tMin,
      throwRatioMax: tMax,
      opticalZoom: tMax > tMin ? `${(tMax / tMin).toFixed(2)}x Optical` : 'Fixed',
      lensShift: 'Vertical Keystone / Shift',
      lensDetails: `Throw ratio ${tMin}:1–${tMax}:1 glass optical assembly`,
      interchangeableLens: false,
      inputLagMs: 16,
      maxRefreshHz: 60,
      hdrSupport: 'HDR10 / HLG',
      builtInAudio: '10W Integrated Speaker',
      smartOs: 'Google TV',
      weightKg: 4.2,
      powerWatts: 260,
      warrantyIndia: '2 Years Official India Warranty',
      serviceNetworkIndia: 'Authorised Pan-India Service Centres',
      indiaClimate: {
        maxAmbientTempC: 40,
        sealedOptics: true,
        dustProtection: 'Sealed Laser Optical Engine',
        humidityTolerance: 'High',
        powerCutResilience: 'High (Solid-State)',
      },
      bestFor: ['cinema', 'all'],
      listings: [
        {
          site: newRetailer,
          priceInr: priceVal,
          mrpInr: mrpVal,
          inStock: true,
          deliveryNote: 'Pan-India insured delivery',
          warrantyVerified: true,
          url: SUBSTACK_NEWSLETTER_URL,
        },
      ],
      priceHistory90d: [
        { month: 'Sep', priceInr: Math.round(priceVal * 1.06) },
        { month: 'Oct', priceInr: Math.round(priceVal * 1.03) },
        { month: 'Nov', priceInr: priceVal },
      ],
    };

    setAddingProduct(true);
    try {
      await addOrUpdateProductInDatabase(modelPayload);
      setNewBrand('');
      setNewModel('');
      setNewTagline('');
      setShowAddProduct(false);
    } finally {
      setAddingProduct(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#b4690e]">
            IbexProjectorsIndia Account
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D3250]">
            {user
              ? userProfile?.signupCompleted
                ? `Welcome back, ${userProfile.displayName.split(' ')[0]}`
                : 'Complete Your Buyer Profile'
              : 'Create Your Free IbexProjectorsIndia Account'}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sync your room throw plans, INR price-drop alerts, Quote Bag, and Substack article
            Q&amp;A clarifications across devices in your private cloud workspace.
          </p>
        </div>

        {user && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('assistant')}
              className="btn-luxury inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Substack Advisor</span>
            </button>
            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Step 1: Signed-Out Sign-Up Card */}
      {!user ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-mono font-semibold text-slate-500">
                STEP 1 OF 2 · INSTANT GOOGLE AUTHENTICATION
              </div>
              <h2 className="text-xl font-bold text-[#1D3250]">
                Sign up in one click with Google
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Verify your account securely via Google Sign-In, then personalize your Indian city,
                room use case, and INR budget tier so our Room Planner and Substack Advisor tailor
                every recommendation to your space.
              </p>
            </div>

            <button
              type="button"
              disabled={authLoading}
              onClick={signInWithGoogle}
              className="btn-luxury w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold rounded-lg disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{authLoading ? 'Connecting with Google...' : 'Continue with Google to Sign Up'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Private cloud sync for saved throw-distance room plans &amp; installer reports</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Saved INR marketplace price-drop targets across Amazon.in, Flipkart &amp; dealers</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Persistent text &amp; live voice Substack article clarifications</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zero spam—only your own profile data isolated under your account ID</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#203656] text-white rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#f5c163]">
                <ShieldCheck className="w-4 h-4" />
                <span>Built for Indian Buyers &amp; AV Integrators</span>
              </div>
              <h3 className="text-xl font-bold leading-snug">
                Personalized optical guidance grounded in live India INR pricing.
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                Once signed up, our interactive Substack &amp; Voice Advisor automatically factors
                in your city climate, target budget tier, and primary viewing environment when
                clarifying buying guides.
              </p>
            </div>

            <div className="pt-5 border-t border-white/15 space-y-3 text-xs text-slate-200">
              <div className="flex items-center justify-between">
                <span>Live Catalog Models</span>
                <span className="font-mono font-bold text-white">{products.length} Models</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Substack Publication</span>
                <a
                  href={SUBSTACK_NEWSLETTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#f5c163] hover:underline font-semibold"
                >
                  <span>ProjectorGuideIndia</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Step 2: Signed-In Onboarding Form + Cloud Summary */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1D3250] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#b4690e]" />
                  <span>Buyer &amp; Room Profile</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Signed in as <span className="font-medium text-slate-700">{user.email}</span>
                </p>
              </div>
              {profileSavedFlag && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <Check className="w-4 h-4" />
                  Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Full Name</span>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Indian City / Region</span>
                <input
                  type="text"
                  maxLength={80}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Bengaluru, Chennai, Mumbai, Pune"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Primary Use Case</span>
                <select
                  value={primaryUseCase}
                  onChange={(e) =>
                    setPrimaryUseCase(e.target.value as Exclude<UseCaseFilter, 'ALL'>)
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
                >
                  {USE_CASE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Target Budget Tier</span>
                <select
                  value={budgetTier}
                  onChange={(e) =>
                    setBudgetTier(e.target.value as Exclude<PriceTierFilter, 'ALL'>)
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
                >
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Preferred Language</span>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native} ({l.label})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Measurement Units</span>
                <select
                  value={preferredUnit}
                  onChange={(e) => setPreferredUnit(e.target.value as UnitSystem)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
                >
                  <option value="ft">Feet &amp; Inches (ft / in)</option>
                  <option value="m">Metric (meters / cm)</option>
                </select>
              </label>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={newsletterSubscribed}
                onChange={(e) => setNewsletterSubscribed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#203656] focus:ring-[#203656]"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                Track my subscription to the{' '}
                <a
                  href={SUBSTACK_NEWSLETTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#203656] underline"
                >
                  ProjectorGuideIndia Substack Newsletter
                </a>{' '}
                for new 2026 India projector reviews and festival price-drop guides.
              </span>
            </label>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-luxury inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving Profile...' : 'Save Account Profile'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('catalog')}
                className="px-4 py-2.5 text-xs font-semibold text-[#203656] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Browse Matching Projectors
              </button>
            </div>
          </form>

          {/* Cloud Activity Summary */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#1D3250]">Your Cloud Workspace</h2>
              <div className="divide-y divide-slate-100 border-y border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveView('calculator')}
                  className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                    <Compass className="w-4 h-4 text-[#203656]" />
                    Saved Room Configurations
                  </span>
                  <span className="font-mono tabular-nums font-bold text-[#203656]">
                    {savedConfigs.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('tracker')}
                  className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                    <TrendingDown className="w-4 h-4 text-[#203656]" />
                    Active INR Price Watches
                  </span>
                  <span className="font-mono tabular-nums font-bold text-[#203656]">
                    {priceWatches.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('assistant')}
                  className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                    <MessageSquare className="w-4 h-4 text-[#203656]" />
                    Saved Substack Advisor Turns
                  </span>
                  <span className="font-mono tabular-nums font-bold text-[#203656]">
                    {chatMessages.length}
                  </span>
                </button>
                <div className="py-3.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5 font-medium text-slate-700">
                    <ShoppingBag className="w-4 h-4 text-[#203656]" />
                    Items in Quote Bag
                  </span>
                  <span className="font-mono tabular-nums font-bold text-[#203656]">
                    {cartItems.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="font-semibold text-[#1D3250] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#b4690e]" />
                <span>Live Product &amp; Pricing Database</span>
              </div>
              <p>
                {productsSource === 'database'
                  ? `Connected live to Firestore (${products.length} active India models with real-time INR marketplace pricing).`
                  : `Showing ${products.length} verified India models. Live database updates appear here immediately once published by the catalog admin.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Product & INR Pricing Database Manager */}
      {isAdmin && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#b4690e]">
                Admin Database Console
              </div>
              <h2 className="text-xl font-bold text-[#1D3250] mt-1">
                Product Catalog &amp; Live INR Pricing Database
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Changes saved here write directly to Firestore <code className="font-mono">/products</code>{' '}
                and update the Catalog, Room Planner, Price Tracker, and Substack Chatbot in real time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={seedingDb}
                onClick={handleSeedDatabase}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#203656] hover:bg-[#172842] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{seedingDb ? 'Syncing Catalog...' : 'Sync All 14 Models to Database'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddProduct((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#203656] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddProduct ? 'Hide New Model Form' : 'Add New Projector'}</span>
              </button>
            </div>
          </div>

          {/* Quick Live INR Price Editor */}
          <form
            onSubmit={handleSaveLivePrice}
            className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <div className="text-sm font-bold text-[#1D3250]">Update Live Retailer INR Pricing</div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <label className="md:col-span-4 block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Projector Model</span>
                <select
                  value={selectedEditModel?.id || ''}
                  onChange={(e) => setSelectedEditModelId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  {products.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.model} ({formatInr(getLowestListing(m).priceInr)})
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-3 block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Retailer</span>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value as MarketplaceListing['site'])}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  {(selectedEditModel?.listings || []).map((l) => (
                    <option key={l.site} value={l.site}>
                      {l.site}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2 block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Selling Price (₹)</span>
                <input
                  type="number"
                  min={1000}
                  max={5000000}
                  step={500}
                  required
                  value={editPriceInr}
                  onChange={(e) => setEditPriceInr(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg"
                />
              </label>

              <label className="md:col-span-2 block space-y-1">
                <span className="text-xs font-semibold text-slate-700">MRP (₹)</span>
                <input
                  type="number"
                  min={1000}
                  max={5000000}
                  step={500}
                  value={editMrpInr}
                  onChange={(e) => setEditMrpInr(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg"
                />
              </label>

              <div className="md:col-span-1">
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="btn-luxury w-full px-3 py-2 text-xs font-bold rounded-lg disabled:opacity-60"
                >
                  {savingPrice ? '...' : 'Save'}
                </button>
              </div>
            </div>
          </form>

          {/* Collapsible Add New Product Form */}
          {showAddProduct && (
            <form
              onSubmit={handleAddProduct}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
            >
              <div className="text-sm font-bold text-[#1D3250]">Add New Projector to Database</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Brand</span>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="e.g., BenQ"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Model Name</span>
                  <input
                    type="text"
                    required
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="e.g., W2720i"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Category</span>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as LensCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ust">Ultra-Short Throw Laser</option>
                    <option value="short_throw">Short Throw</option>
                    <option value="standard">Standard Throw</option>
                    <option value="cinema_tele">Cinema Telephoto</option>
                    <option value="portable">Smart Portable</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Native Resolution</span>
                  <input
                    type="text"
                    value={newResolution}
                    onChange={(e) => setNewResolution(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">ISO Lumens</span>
                  <input
                    type="number"
                    min={200}
                    max={30000}
                    value={newLumens}
                    onChange={(e) => setNewLumens(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Throw Ratio Min</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0.15}
                    max={5}
                    value={newThrowMin}
                    onChange={(e) => setNewThrowMin(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Throw Ratio Max</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0.15}
                    max={5}
                    value={newThrowMax}
                    onChange={(e) => setNewThrowMax(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Primary Retailer</span>
                  <select
                    value={newRetailer}
                    onChange={(e) =>
                      setNewRetailer(e.target.value as MarketplaceListing['site'])
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Amazon.in">Amazon.in</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Ooberpad India">Ooberpad India</option>
                    <option value="AVShack India">AVShack India</option>
                    <option value="Croma">Croma</option>
                    <option value="Reliance Digital">Reliance Digital</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Selling Price (₹)</span>
                  <input
                    type="number"
                    min={5000}
                    max={5000000}
                    value={newPriceInr}
                    onChange={(e) => setNewPriceInr(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">MRP (₹)</span>
                  <input
                    type="number"
                    min={5000}
                    max={5000000}
                    value={newMrpInr}
                    onChange={(e) => setNewMrpInr(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </label>
                <label className="sm:col-span-2 block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Short Tagline</span>
                  <input
                    type="text"
                    maxLength={240}
                    value={newTagline}
                    onChange={(e) => setNewTagline(e.target.value)}
                    placeholder="Key highlights for Indian buyers"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={addingProduct}
                className="btn-luxury inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                <span>{addingProduct ? 'Saving...' : 'Save Projector to Database'}</span>
              </button>
            </form>
          )}

          {/* Compact Live Database Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Model</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-right">ISO Lumens</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Lowest INR</th>
                  <th className="py-2.5 px-3 font-semibold">Best Retailer</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((m) => {
                  const lowest = getLowestListing(m);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-[#1D3250]">
                        {m.brand} {m.model}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{m.categoryLabel}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        {m.isoLumens.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#203656]">
                        {formatInr(lowest.priceInr)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{lowest.site}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => openProductPage(m.id)}
                          className="text-[#203656] hover:text-[#b4690e] font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

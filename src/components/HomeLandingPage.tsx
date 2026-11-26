import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  ExternalLink,
  FileText,
  MessageSquare,
  Scale,
  ShoppingBag,
  Star,
  TrendingDown,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LENS_PRESETS, SUBSTACK_NEWSLETTER_URL } from '../data/projectorsIndia';
import { PriceTierFilter, ProjectorModel, UseCaseFilter } from '../types/projector';
import {
  formatInr,
  formatLength,
  getLowestListing,
  getModelPriceTier,
  getPriceTierLabel,
  METERS_TO_INCHES,
} from '../utils/optics';

const HERO_IMAGE = '/src/assets/images/hero_home_cinema_india_1795636830697.jpg';

const CATEGORY_CARDS: {
  id: Exclude<PriceTierFilter, 'ALL'>;
  name: string;
  priceRange: string;
  description: string;
  image: string;
}[] = [
  {
    id: 'budget',
    name: 'Budget',
    priceRange: 'Under ₹1.15L',
    description: 'Affordable Full HD & smart portable quality for everyday home viewing',
    image: '/src/assets/images/projector_portable_led_1795409894504.jpg',
  },
  {
    id: 'premium',
    name: 'Premium',
    priceRange: '₹1.15L – ₹2.0L',
    description: 'Enhanced 4K UHD & high-brightness optics for sunlit living rooms',
    image: '/src/assets/images/projector_gaming_short_1795409894536.jpg',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    priceRange: '₹2.0L – ₹3.5L',
    description: 'Tri-color laser & ultra-short-throw projection technology',
    image: '/src/assets/images/projector_ust_laser_1795409895474.jpg',
  },
  {
    id: 'ultra-luxury',
    name: 'Ultra Luxury',
    priceRange: 'Above ₹3.5L',
    description: 'Reference native 4K & motorized-lens home cinema engineering',
    image: '/src/assets/images/projector_cinema_4k_1795409893518.jpg',
  },
];

const USE_CASE_CARDS: {
  id: Exclude<UseCaseFilter, 'ALL'>;
  name: string;
  specHint: string;
  description: string;
  image: string;
}[] = [
  {
    id: 'home-entertainment',
    name: 'Home Entertainment',
    specHint: '4K HDR · Low-Lag Gaming',
    description: 'Perfect for family movie nights, IPL cricket, and 120Hz console gaming',
    image: '/src/assets/images/usecase_home_cinema_1795672734974.jpg',
  },
  {
    id: 'training-education',
    name: 'Training & Education',
    specHint: '2,400+ ISO Lumens · Crisp Text',
    description: 'Ideal for sunlit classrooms, university lecture halls, and corporate rooms',
    image: '/src/assets/images/usecase_training_room_1795672736263.jpg',
  },
  {
    id: 'house-of-god',
    name: 'House of God',
    specHint: 'Sealed Laser · High Output',
    description: 'Long-throw solid-state projection built for sanctuaries and congregations',
    image: '/src/assets/images/usecase_worship_hall_1795672737492.jpg',
  },
  {
    id: 'events',
    name: 'Events',
    specHint: 'Portable & Venue-Grade',
    description: 'High-brightness portable and courtyard projection for live gatherings',
    image: '/src/assets/images/usecase_outdoor_events_1795672738946.jpg',
  },
];

const TOP_SELLING_ENTRIES: {
  id: string;
  userRating: number;
  opticRating: number;
}[] = [
  { id: 'epson-co-fh02', userRating: 4.5, opticRating: 4.4 },
  { id: 'epson-eh-tw6250', userRating: 4.7, opticRating: 4.6 },
  { id: 'benq-tk700sti', userRating: 4.7, opticRating: 4.7 },
  { id: 'xgimi-horizon-ultra', userRating: 4.6, opticRating: 4.7 },
  { id: 'hisense-px3-pro', userRating: 4.9, opticRating: 4.9 },
  { id: 'epson-eh-ls12000b', userRating: 4.9, opticRating: 5.0 },
];

const CUSTOMER_TESTIMONIALS = [
  {
    initials: 'RN',
    name: 'Rajesh Nair',
    role: 'Home Cinema Owner · Bengaluru',
    rating: 5,
    quote:
      'Our west-facing living room used to wash out our old lamp projector. Using the Room Planner here, we paired a 3,000 ISO lumen TriChroma UST with a 110" CLR screen—daytime IPL and evening 4K films both look razor sharp.',
  },
  {
    initials: 'PD',
    name: 'Priya Deshmukh',
    role: 'Director, Apex Training Academy · Pune',
    rating: 5,
    quote:
      'We outfitted three sunlit seminar rooms under ₹1.15L per unit without guesswork on throw distance. Every ceiling mount drop cleared our fans on the first installation, and the INR dealer comparisons saved us nearly ₹28,000.',
  },
  {
    initials: 'VM',
    name: 'Vikramaditya Menon',
    role: 'AV Coordinator, Community Auditorium · Kochi',
    rating: 5,
    quote:
      'Coastal monsoon humidity ruined open-optic lamps for us in under two years. Switching to an IP6X sealed laser model recommended for our hall throw distance gave us bright, maintenance-free weekend screenings.',
  },
];

interface CarouselRowProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const CarouselSection: React.FC<CarouselRowProps> = ({ title, subtitle, children }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const distance = Math.max(300, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1260px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="sm:text-left text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D3250]">
            {title}
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600">{subtitle}</p>
        </div>

        <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label={`Scroll ${title} left`}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white text-[#203656] hover:bg-slate-50 hover:border-[#203656]/40 flex items-center justify-center transition-colors shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label={`Scroll ${title} right`}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white text-[#203656] hover:bg-slate-50 hover:border-[#203656]/40 flex items-center justify-center transition-colors shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-1 px-1"
      >
        {children}
      </div>
    </div>
  );
};

export const HomeLandingPage: React.FC = () => {
  const {
    t,
    unit,
    user,
    products,
    getProductById,
    setActiveView,
    openProductPage,
    openCatalogWithFilter,
    updateConfig,
    addToCart,
    markNewsletterSubscribed,
    showToast,
  } = useApp();

  // Interactive Quick Throw Estimator state (powers the closing help section)
  const [quickDiagInches, setQuickDiagInches] = useState<number>(110);
  const [quickPresetId, setQuickPresetId] = useState<string>('standard-home');

  const topSellingModels = useMemo(() => {
    return TOP_SELLING_ENTRIES.map((entry) => {
      const model = getProductById(entry.id);
      if (!model) return null;
      return { ...entry, model };
    }).filter(
      (item): item is { id: string; userRating: number; opticRating: number; model: ProjectorModel } =>
        Boolean(item)
    );
  }, [getProductById]);

  const quickPreset = useMemo(
    () => LENS_PRESETS.find((p) => p.id === quickPresetId) || LENS_PRESETS[2],
    [quickPresetId]
  );

  const quickScreenWidthM = useMemo(
    () => (quickDiagInches / METERS_TO_INCHES) * (16 / Math.sqrt(337)),
    [quickDiagInches]
  );
  const quickMinThrowM = quickScreenWidthM * quickPreset.throwRatioMin;
  const quickMaxThrowM = quickScreenWidthM * quickPreset.throwRatioMax;

  const handleLaunchModelInPlanner = (model: ProjectorModel) => {
    const midRatio = Number(((model.throwRatioMin + model.throwRatioMax) / 2).toFixed(2));
    updateConfig({
      throwRatio: midRatio,
      mountingType: model.category === 'ust' ? 'ust_console' : 'ceiling',
    });
    setActiveView('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded ${model.brand} ${model.model} (${midRatio}:1) into Room Planner.`, 'success');
  };

  const handleLaunchQuickEstimate = () => {
    updateConfig({
      screenWidthMeters: Number(quickScreenWidthM.toFixed(2)),
      throwRatio: quickPreset.defaultThrowRatio,
      lensPresetId: quickPreset.id,
      aspectRatio: '16:9',
      mountingType: quickPreset.category === 'ust' ? 'ust_console' : 'ceiling',
    });
    setActiveView('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(
      `Calibrated ${quickDiagInches}" screen with ${quickPreset.name.split(' (')[0]} lens.`,
      'success'
    );
  };

  return (
    <div className="bg-white">
      {/* 1. Full-Bleed Cinematic Hero Showcase (Modeled on Pro Projector Spotlight) */}
      <section className="relative min-h-[540px] lg:min-h-[600px] flex items-center overflow-hidden border-b border-slate-200/80 bg-slate-100">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Luxury Indian home cinema living room with ultra-short-throw laser projector"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/25" />
        </div>

        <div className="relative z-10 w-full max-w-[1260px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl space-y-6">
            <div className="text-xs sm:text-sm font-medium text-slate-600">
              <span>IbexProjectorsIndia</span>
              <span className="mx-2 text-slate-400">·</span>
              <span>{products.length} Verified India Models</span>
              <span className="mx-2 text-slate-400">·</span>
              <span>Optical Room Planner</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-[#1D3250] leading-[1.08] text-balance">
              Bring Home the Theater Experience Today
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              From sunlit Indian living rooms to classrooms, sanctuaries, and live events—discover
              verified ISO lumens, transparent INR pricing, and the exact throw distance for your
              space.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => openCatalogWithFilter()}
                className="btn-luxury inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-lg whitespace-nowrap shrink-0"
              >
                <span>Explore Projectors</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => openCatalogWithFilter({ priceTier: 'budget' })}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#203656] bg-white/95 hover:bg-white border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>View Budget Options</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('calculator');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-2 py-2 text-sm font-semibold text-[#203656] hover:text-[#b4690e] underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                <Compass className="w-4 h-4" />
                <span>Open Room Planner</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category Carousel (Budget -> Ultra Luxury) */}
      <section className="py-16 lg:py-20 bg-white">
        <CarouselSection
          title="Shop by Category"
          subtitle="Curated India projector tiers from everyday Full HD to reference-grade 4K laser cinema."
        >
          {CATEGORY_CARDS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => openCatalogWithFilter({ priceTier: cat.id })}
              className="snap-start shrink-0 w-[84%] sm:w-[46%] lg:w-[31.5%] text-left bg-white border border-slate-200 rounded-xl overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] hover:border-slate-300"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={cat.image}
                  alt={`${cat.name} category projectors`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-xl font-bold text-[#1D3250] group-hover:text-[#b4690e] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-500 shrink-0">
                    {cat.priceRange}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{cat.description}</p>
              </div>
            </button>
          ))}
        </CarouselSection>
      </section>

      {/* 3. Shop by Use Case Carousel (Soft Mist Surface Band) */}
      <section className="py-16 lg:py-20 bg-[#F1F5F9]/75 border-y border-slate-200/70">
        <CarouselSection
          title="Shop by Use Case"
          subtitle="Matched to real Indian ambient daylight, ceiling heights, and venue acoustics."
        >
          {USE_CASE_CARDS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => openCatalogWithFilter({ useCase: seg.id })}
              className="snap-start shrink-0 w-[84%] sm:w-[46%] lg:w-[31.5%] text-left bg-white border border-slate-200 rounded-xl overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] hover:border-slate-300"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={seg.image}
                  alt={seg.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="text-xs font-medium text-slate-500">{seg.specHint}</div>
                <h3 className="text-xl font-bold text-[#1D3250] group-hover:text-[#b4690e] transition-colors">
                  {seg.name}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{seg.description}</p>
              </div>
            </button>
          ))}
        </CarouselSection>
      </section>

      {/* 4. Top Selling Projectors (3-Column Spotlight Grid) */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-[1260px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D3250]">
              Top Selling Projectors
            </h2>
            <p className="mt-2.5 text-base text-slate-600">
              Our most popular India-verified models, trusted for optical accuracy and official
              warranty coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {topSellingModels.map(({ model, userRating, opticRating }) => {
              const lowest = getLowestListing(model);
              const tierLabel = getPriceTierLabel(getModelPriceTier(model));

              return (
                <article
                  key={model.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] hover:border-slate-300"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => openProductPage(model.id)}
                      className="block w-full aspect-[4/3] bg-slate-100 overflow-hidden text-left group"
                    >
                      <img
                        src={model.imageUrl}
                        alt={`${model.brand} ${model.model}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </button>

                    <div className="p-6 space-y-4">
                      {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span className="font-semibold text-[#203656]">
                          {tierLabel} · {model.brand}
                        </span>
                        <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                          <span className="inline-flex items-center gap-1 text-slate-700">
                            <Star className="w-3.5 h-3.5 fill-[#efa02b] text-[#efa02b]" />
                            <span className="font-semibold">{userRating.toFixed(1)}</span>
                            <span className="font-sans text-slate-400">User</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-700">
                            <Star className="w-3.5 h-3.5 fill-[#203656] text-[#203656]" />
                            <span className="font-semibold">{opticRating.toFixed(1)}</span>
                            <span className="font-sans text-slate-400">Critic</span>
                          </span>
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => openProductPage(model.id)}
                          className="text-left text-xl font-bold text-[#1D3250] hover:text-[#b4690e] transition-colors block"
                        >
                          {model.brand} {model.model}
                        </button>
                        <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {model.tagline}
                        </p>
                      </div>

                      {/* 3 Concise Optical Highlights (Clean Typographic List) */}
                      <ul className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-700">
                        <li className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Resolution &amp; Light</span>
                          <span className="font-medium text-slate-900 text-right">
                            {model.nativeResolution.split(' (')[0]} · {model.lightSource}
                          </span>
                        </li>
                        <li className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Brightness &amp; Throw</span>
                          <span className="font-mono tabular-nums font-medium text-slate-900">
                            {model.isoLumens.toLocaleString('en-IN')} ISO lm ·{' '}
                            {model.throwRatioMin === model.throwRatioMax
                              ? `${model.throwRatioMin}:1`
                              : `${model.throwRatioMin}–${model.throwRatioMax}:1`}
                          </span>
                        </li>
                        <li className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">India Warranty</span>
                          <span className="font-medium text-slate-900 truncate max-w-[190px] text-right">
                            {model.warrantyIndia}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Contiguous Price + Actions Footer */}
                  <div className="px-6 py-4 bg-slate-50/75 border-t border-slate-200/70 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-2xl font-extrabold font-mono tabular-nums text-[#203656]">
                        {formatInr(lowest.priceInr)}
                      </div>
                      <div className="text-[11px] text-slate-500">Lowest on {lowest.site}</div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLaunchModelInPlanner(model)}
                        title="Test throw distance in Room Planner"
                        className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-[#203656] bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Plan</span>
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
                        title="Add to Quote Bag"
                        aria-label={`Add ${model.brand} ${model.model} to quote bag`}
                        className="p-2 text-[#203656] bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openProductPage(model.id)}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-[#203656] hover:bg-[#172842] rounded-lg transition-colors whitespace-nowrap"
                      >
                        Specs
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => openCatalogWithFilter()}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#203656] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>Browse All {products.length} Projectors in {t.navCatalog}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. What Our Customers Say (Soft Mist Surface Band) */}
      <section className="py-16 lg:py-20 bg-[#F1F5F9]/75 border-y border-slate-200/70">
        <div className="max-w-[1260px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D3250]">
              What Our Customers Say
            </h2>
            <p className="mt-2.5 text-base text-slate-600">
              Real optical setups and installations across Indian homes, institutes, and community
              venues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {CUSTOMER_TESTIMONIALS.map((item) => (
              <article
                key={item.name}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-[var(--shadow-elegant)] flex flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      aria-hidden="true"
                      className="w-14 h-14 rounded-full bg-[#203656] text-[#f5c163] font-display font-bold text-base flex items-center justify-center shrink-0"
                    >
                      {item.initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#1D3250] truncate">{item.name}</h3>
                      <p className="text-xs text-slate-500 truncate">{item.role}</p>
                      <div
                        className="flex items-center gap-0.5 mt-1.5"
                        aria-label={`${item.rating} out of 5 stars`}
                      >
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < item.rating
                                ? 'fill-[#efa02b] text-[#efa02b]'
                                : 'fill-slate-200 text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Need Help Finding the Perfect Projector? (Interactive Room Planner + Quick Estimator) */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D3250] text-balance">
            Need Help Finding the Perfect Projector?
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
            Estimate your throw distance below or open our full interactive Room Planner—available
            in English, Hindi, Tamil, Telugu, and Kannada with India daylight, heat, and UPS
            guidance.
          </p>

          {/* Compact Real Interactive Quick Throw Estimator */}
          <div className="mt-8 bg-[#F8FAFC] border border-slate-200 rounded-xl p-6 text-left max-w-3xl mx-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              <div className="md:col-span-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1D3250]">Target 16:9 Screen Size</span>
                  <span className="font-mono tabular-nums font-bold text-[#203656]">
                    {quickDiagInches}&quot; (W: {formatLength(quickScreenWidthM, unit, 2)})
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 p-1 bg-slate-200/70 rounded-lg">
                  {[85, 100, 110, 120, 150].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setQuickDiagInches(size)}
                      className={`py-2 text-xs font-mono tabular-nums font-semibold rounded-md transition-colors ${
                        quickDiagInches === size
                          ? 'bg-white text-[#203656] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {size}&quot;
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-4 space-y-2">
                <label className="block text-xs font-semibold text-[#1D3250]">Lens Category</label>
                <select
                  value={quickPresetId}
                  onChange={(e) => setQuickPresetId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
                >
                  {LENS_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.throwRatioMin}–{p.throwRatioMax}:1)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5">
                <div className="text-[11px] font-medium text-slate-500">Throw Distance</div>
                <div className="text-sm font-extrabold font-mono tabular-nums text-[#203656] mt-0.5">
                  {formatLength(quickMinThrowM, unit, 1)} – {formatLength(quickMaxThrowM, unit, 1)}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleLaunchQuickEstimate}
                className="btn-luxury inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg whitespace-nowrap shrink-0"
              >
                <Compass className="w-4 h-4" />
                <span>Launch in Room Planner</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('assistant');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#203656] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <MessageSquare className="w-4 h-4 text-[#b4690e]" />
                <span>Ask Substack &amp; Voice Advisor</span>
              </button>
            </div>
          </div>

          {/* Direct Utility Links Strip (Compare · Price Drops · Installer PDF · Account · Substack) */}
          <div className="mt-10 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-semibold text-[#203656]">
            <button
              type="button"
              onClick={() => {
                setActiveView('compare');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 hover:text-[#b4690e] transition-colors whitespace-nowrap"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Models</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView('tracker');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 hover:text-[#b4690e] transition-colors whitespace-nowrap"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Track India Price Drops</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView('report');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 hover:text-[#b4690e] transition-colors whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              <span>Installer PDF Studio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView('signup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 hover:text-[#b4690e] transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>{user ? 'Manage Account & DB' : 'Create Free Account'}</span>
            </button>

            <a
              href={SUBSTACK_NEWSLETTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                void markNewsletterSubscribed();
              }}
              className="inline-flex items-center gap-1.5 hover:text-[#b4690e] transition-colors whitespace-nowrap"
            >
              <span>India Deals Newsletter</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import {
  ExternalLink,
  LayoutGrid,
  List,
  Mail,
  Scale,
  Search,
  ShoppingBag,
  TrendingDown,
} from 'lucide-react';
import { useApp, getSuggestedTargetPrice } from '../context/AppContext';
import { SUBSTACK_NEWSLETTER_URL } from '../data/projectorsIndia';
import { LensCategory, PriceTierFilter, UseCaseFilter } from '../types/projector';
import { formatInr, getLowestListing, getModelPriceTier, matchesUseCase } from '../utils/optics';

type SortKey = 'price_asc' | 'lumens_desc' | 'throw_asc' | 'lag_asc';

export const CatalogDirectory: React.FC = () => {
  const {
    t,
    products,
    openProductPage,
    compareIds,
    toggleCompareModel,
    addOrUpdatePriceWatch,
    addToCart,
    markNewsletterSubscribed,
    catalogFilter,
    setCatalogFilter,
  } = useApp();

  const queryText = catalogFilter.query;
  const selectedBrand = catalogFilter.brand;
  const selectedCategory = catalogFilter.category;
  const selectedPriceTier = catalogFilter.priceTier;
  const selectedUseCase = catalogFilter.useCase;
  const setQueryText = (query: string) => setCatalogFilter({ query });
  const setSelectedBrand = (brand: string) => setCatalogFilter({ brand });
  const setSelectedCategory = (category: LensCategory | 'ALL') => setCatalogFilter({ category });
  const setSelectedPriceTier = (priceTier: PriceTierFilter) => setCatalogFilter({ priceTier });
  const setSelectedUseCase = (useCase: UseCaseFilter) => setCatalogFilter({ useCase });

  const [sortBy, setSortBy] = useState<SortKey>('price_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const brands = useMemo(
    () => Array.from(new Set(products.map((m) => m.brand))).sort(),
    [products]
  );

  const filteredModels = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const list = products.filter((m) => {
      if (selectedBrand !== 'ALL' && m.brand !== selectedBrand) return false;
      if (selectedCategory !== 'ALL' && m.category !== selectedCategory) return false;
      if (selectedPriceTier !== 'ALL' && getModelPriceTier(m) !== selectedPriceTier) return false;
      if (!matchesUseCase(m, selectedUseCase)) return false;
      if (q) {
        const hay = `${m.brand} ${m.model} ${m.categoryLabel} ${m.nativeResolution} ${m.lightSource} ${m.tagline}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') {
        return getLowestListing(a).priceInr - getLowestListing(b).priceInr;
      }
      if (sortBy === 'lumens_desc') return b.isoLumens - a.isoLumens;
      if (sortBy === 'throw_asc') return a.throwRatioMin - b.throwRatioMin;
      return a.inputLagMs - b.inputLagMs;
    });
  }, [products, queryText, selectedBrand, selectedCategory, selectedPriceTier, selectedUseCase, sortBy]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            {t.masterCatalogTitle}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">{t.masterCatalogSub}</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Master Table</span>
          </button>
        </div>
      </div>

      {/* Master Brand Index Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedBrand('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              selectedBrand === 'ALL'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.allBrands} ({products.length})
          </button>
          {brands.map((brand) => {
            const count = products.filter((m) => m.brand === brand).length;
            const active = selectedBrand === brand;
            return (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  active
                    ? 'border-blue-700 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {brand} ({count})
              </button>
            );
          })}
        </div>

        {/* Search, Price Tier, Use Case, Lens Category & Sort Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
          <div className="md:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#203656]"
            />
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by price tier"
              value={selectedPriceTier}
              onChange={(e) => setSelectedPriceTier(e.target.value as PriceTierFilter)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
            >
              <option value="ALL">All Price Tiers</option>
              <option value="budget">Budget (&lt; ₹1.15L)</option>
              <option value="premium">Premium (₹1.15L–₹2L)</option>
              <option value="luxury">Luxury (₹2L–₹3.5L)</option>
              <option value="ultra-luxury">Ultra Luxury (₹3.5L+)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by use case"
              value={selectedUseCase}
              onChange={(e) => setSelectedUseCase(e.target.value as UseCaseFilter)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
            >
              <option value="ALL">All Use Cases</option>
              <option value="home-entertainment">Home Entertainment</option>
              <option value="training-education">Training &amp; Education</option>
              <option value="house-of-god">House of God</option>
              <option value="events">Events</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filter by lens category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as LensCategory | 'ALL')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
            >
              <option value="ALL">{t.allCategories}</option>
              <option value="ust">Ultra-Short Throw (UST 0.16–0.25:1)</option>
              <option value="short_throw">Short Throw (0.49–1.08:1)</option>
              <option value="standard">Standard Home Zoom (1.06–2.24:1)</option>
              <option value="cinema_tele">Pro Cinema Tele-Zoom (1.35–2.84:1)</option>
              <option value="portable">Portable &amp; Compact Smart</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Sort projectors"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203656]"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="lumens_desc">Highest ISO Lumens</option>
              <option value="throw_asc">Shortest Throw</option>
              <option value="lag_asc">Lowest Input Lag</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {filteredModels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm font-semibold text-slate-900">No projector models matched your filters</p>
          <p className="mt-1 text-xs text-slate-500">
            Reset brand, tier, use case, or lens category filters to view the complete India directory.
          </p>
          <button
            type="button"
            onClick={() => {
              setQueryText('');
              setSelectedBrand('ALL');
              setSelectedCategory('ALL');
              setSelectedPriceTier('ALL');
              setSelectedUseCase('ALL');
            }}
            className="mt-4 px-4 py-2 text-xs font-medium text-white bg-[#203656] rounded-lg hover:bg-[#172842]"
          >
            Reset Directory Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredModels.map((model) => {
            const lowest = getLowestListing(model);
            const isComparing = compareIds.includes(model.id);

            return (
              <article
                key={model.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => openProductPage(model.id)}
                    className="block w-full aspect-[4/3] bg-slate-100 overflow-hidden text-left"
                  >
                    <img
                      src={model.imageUrl}
                      alt={`${model.brand} ${model.model}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
                    />
                  </button>

                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{model.brand}</span>
                        <span className="mx-1.5">·</span>
                        <span>{model.categoryLabel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProductPage(model.id)}
                        className="mt-1 text-left text-base font-bold text-slate-900 hover:text-blue-700 transition-colors"
                      >
                        {model.brand} {model.model}
                      </button>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{model.tagline}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-3 py-2.5 border-y border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Native Resolution</span>
                        <span className="font-medium text-slate-900">{model.nativeResolution}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Brightness (ISO)</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          {model.isoLumens.toLocaleString('en-IN')} lm
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Throw Ratio / Lens</span>
                        <span className="font-mono tabular-nums text-slate-800">
                          {model.throwRatioMin === model.throwRatioMax
                            ? `${model.throwRatioMin}:1`
                            : `${model.throwRatioMin}–${model.throwRatioMax}:1`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">India Warranty</span>
                        <span className="text-slate-800 line-clamp-1">{model.warrantyIndia}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200/80 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                        {formatInr(lowest.priceInr)}
                      </span>
                      <span className="ml-1.5 text-[11px] text-slate-500">
                        lowest on {lowest.site}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {model.listings.length} India stores
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openProductPage(model.id)}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Open Product Page
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCompareModel(model.id)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                        isComparing
                          ? 'border-blue-700 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5 inline mr-1" />
                      {isComparing ? 'In Compare' : 'Compare'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addOrUpdatePriceWatch(model.id, getSuggestedTargetPrice(model.id))
                      }
                      title="Track Price Drop"
                      aria-label={`Track price for ${model.brand} ${model.model}`}
                      className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:text-blue-700 rounded-lg"
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
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
                      className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:text-blue-700 rounded-lg"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* High-Density Architectural Master Table */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Brand &amp; Model</th>
                  <th className="py-3 px-3">Resolution &amp; Source</th>
                  <th className="py-3 px-3 text-right">ISO Lumens</th>
                  <th className="py-3 px-3 text-right">Throw Ratio</th>
                  <th className="py-3 px-3">Lens &amp; Shift</th>
                  <th className="py-3 px-3">India Warranty</th>
                  <th className="py-3 px-4 text-right">Best India Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredModels.map((model) => {
                  const lowest = getLowestListing(model);
                  const isComparing = compareIds.includes(model.id);
                  return (
                    <tr key={model.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openProductPage(model.id)}
                          className="font-semibold text-slate-900 hover:text-blue-700 text-left block"
                        >
                          {model.brand} {model.model}
                        </button>
                        <span className="text-[11px] text-slate-500">{model.categoryLabel}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-900 font-medium">{model.nativeResolution}</div>
                        <div className="text-[11px] text-slate-500">
                          {model.displayTech} · {model.lightSource}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {model.isoLumens.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                        {model.throwRatioMin === model.throwRatioMax
                          ? `${model.throwRatioMin}:1`
                          : `${model.throwRatioMin}–${model.throwRatioMax}:1`}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-[200px]">
                        <div className="truncate">{model.opticalZoom}</div>
                        <div className="text-[11px] text-slate-500 truncate">{model.lensShift}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-[200px]">
                        <div className="line-clamp-2">{model.warrantyIndia}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono tabular-nums font-bold text-slate-900">
                          {formatInr(lowest.priceInr)}
                        </div>
                        <div className="text-[11px] text-slate-500">{lowest.site}</div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openProductPage(model.id)}
                          className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:underline mr-2"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCompareModel(model.id)}
                          className={`px-2 py-1 text-xs font-medium rounded border ${
                            isComparing
                              ? 'border-blue-700 bg-blue-50 text-blue-800'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isComparing ? 'Added' : 'Compare'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Substack Newsletter Registration Card */}
      <section className="bg-slate-900 text-white rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
            <Mail className="w-4 h-4" />
            <span>ProjectorGuide India Newsletter</span>
          </div>
          <h2 className="mt-1.5 text-lg font-bold text-white">{t.newsletterTitle}</h2>
          <p className="mt-1 text-sm text-slate-300 leading-relaxed">{t.newsletterDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href={SUBSTACK_NEWSLETTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              void markNewsletterSubscribed();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>{t.subscribeSubstack}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
};

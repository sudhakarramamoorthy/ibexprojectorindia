import React, { useState } from 'react';
import {
  Cloud,
  Compass,
  ExternalLink,
  FileText,
  Globe,
  HardDrive,
  Home,
  LayoutGrid,
  Menu,
  MessageSquare,
  Scale,
  ShoppingBag,
  TrendingDown,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomeLandingPage } from './components/HomeLandingPage';
import { CalculatorDashboard } from './components/CalculatorDashboard';
import { CatalogDirectory } from './components/CatalogDirectory';
import { ProductDetailView } from './components/ProductDetailView';
import { ComparisonDashboard } from './components/ComparisonDashboard';
import { PriceTrackerDashboard } from './components/PriceTrackerDashboard';
import { InstallerReportView } from './components/InstallerReportView';
import { AssistantHub } from './components/AssistantHub';
import { SignUpPage } from './components/SignUpPage';
import { QuoteBagDrawer } from './components/QuoteBagDrawer';
import { OfflineIndicator, PWAInstallButton } from './components/PWAControls';
import { SUPPORTED_LANGUAGES } from './i18n/translations';
import { SUBSTACK_NEWSLETTER_URL } from './data/projectorsIndia';
import { ActiveView, LanguageCode } from './types/projector';

const DashboardShell: React.FC = () => {
  const {
    user,
    userProfile,
    activeView,
    setActiveView,
    openCatalogWithFilter,
    language,
    setLanguage,
    t,
    compareIds,
    priceWatches,
    cartItems,
    setCartOpen,
    markNewsletterSubscribed,
    toast,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalBagCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Strict 5 top-level navigation links (1-2 word single-line labels)
  const topNavLinks: {
    id: ActiveView;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }[] = [
    { id: 'calculator', label: t.navCalculator, icon: Compass },
    { id: 'catalog', label: t.navCatalog, icon: LayoutGrid },
    { id: 'compare', label: t.navCompare, icon: Scale, count: compareIds.length || undefined },
    { id: 'tracker', label: t.navTracker, icon: TrendingDown, count: priceWatches.length || undefined },
    { id: 'assistant', label: 'Ask Advisor', icon: MessageSquare },
  ];

  // Compact 5-item mobile bottom navigation starting with Home
  const mobileBottomLinks: {
    id: ActiveView;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'home', shortLabel: t.navHome, icon: Home },
    { id: 'calculator', shortLabel: 'Planner', icon: Compass },
    { id: 'catalog', shortLabel: 'Catalog', icon: LayoutGrid },
    { id: 'assistant', shortLabel: 'Advisor', icon: MessageSquare },
    { id: 'signup', shortLabel: user ? 'Account' : 'Sign Up', icon: user ? UserCheck : UserPlus },
  ];

  const activeBreadcrumb = (() => {
    switch (activeView) {
      case 'home':
        return t.navHome;
      case 'calculator':
        return t.navCalculator;
      case 'catalog':
        return t.navCatalog;
      case 'product':
        return `${t.navCatalog} / Product Specification`;
      case 'compare':
        return t.navCompare;
      case 'tracker':
        return t.navTracker;
      case 'report':
        return t.navReport;
      case 'assistant':
        return 'Substack & Voice Advisor';
      case 'signup':
        return user ? 'Account & Database' : 'Sign Up';
    }
  })();

  const handleNavClick = (view: ActiveView) => {
    if (view === 'catalog') {
      openCatalogWithFilter();
    } else {
      setActiveView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="no-print sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200/90">
        <div className="max-w-[1320px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark (links to Landing Page) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-[#203656] rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="text-lg font-extrabold tracking-tight text-[#203656] font-display whitespace-nowrap shrink-0 hover:text-[#b4690e] transition-colors"
            >
              {t.brandTitle}
            </button>
          </div>

          {/* Zone 2: 5 Clean Single-Line Text Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            {topNavLinks.map((item) => {
              const isActive =
                activeView === item.id || (activeView === 'product' && item.id === 'catalog');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    isActive
                      ? 'text-[#203656] border-[#df9f20] font-semibold'
                      : 'border-transparent hover:text-[#203656] hover:border-slate-300'
                  }`}
                >
                  {item.label}
                  {item.count !== undefined && (
                    <span className="ml-1 text-xs font-mono tabular-nums text-slate-400">
                      ({item.count})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action (Sign Up / Account & Database Console) */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={() => handleNavClick('signup')}
                title={`Signed in as ${userProfile?.displayName || user.displayName || user.email}`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeView === 'signup'
                    ? 'bg-[#203656] text-white'
                    : 'text-[#203656] bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="max-w-[110px] truncate">
                  {(userProfile?.displayName || user.displayName || 'Account').split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavClick('signup')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#203656] hover:bg-[#172842] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Menu */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full border-r border-slate-200 flex flex-col z-10">
            <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 font-display">
                {t.brandTitle}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <button
                type="button"
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg ${
                  activeView === 'home'
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t.navHome}</span>
              </button>
              {topNavLinks.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeView === item.id || (activeView === 'product' && item.id === 'catalog');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg ${
                      isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </span>
                    {item.count !== undefined && (
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleNavClick('report')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg ${
                  activeView === 'report'
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t.navReport}</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('signup')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg ${
                  activeView === 'signup'
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {user ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{user ? 'Account & Database' : 'Sign Up'}</span>
              </button>
            </nav>
            <div className="p-4 border-t border-slate-200 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCartOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />
                  <span>{t.quoteBag}</span>
                </span>
                <span className="font-mono tabular-nums font-semibold">({totalBagCount})</span>
              </button>

              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  aria-label="Select Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native} ({l.label})
                    </option>
                  ))}
                </select>
              </div>
              <PWAInstallButton />
              <a
                href={SUBSTACK_NEWSLETTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void markNewsletterSubscribed();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium"
              >
                <span>{t.subscribeSubstack}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Non-Sticky Contextual Workspace Utility Strip (Breadcrumb + Language + Quote Bag + Install) */}
      <div className="no-print border-b border-slate-200/70 bg-slate-50/70">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className={`hover:text-[#203656] transition-colors ${
                activeView === 'home' ? 'font-semibold text-[#203656]' : ''
              }`}
            >
              {t.navHome}
            </button>
            {activeView !== 'home' && (
              <>
                <span aria-hidden="true">/</span>
                <span className="font-semibold text-[#203656]">{activeBreadcrumb}</span>
              </>
            )}
            <span className="hidden md:inline text-slate-300 mx-1">·</span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-500">
              {user ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.cloudSynced}</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.localOfflineMode}</span>
                </>
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#203656] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#b4690e]" />
              <span>{t.quoteBag}</span>
              <span className="font-mono tabular-nums font-semibold text-[#203656]">
                ({totalBagCount})
              </span>
            </button>

            <div className="hidden sm:block">
              <PWAInstallButton compact />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main
        className={
          activeView === 'home'
            ? 'flex-1 w-full pb-16 lg:pb-0'
            : 'flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 lg:pb-14 bg-slate-50/40'
        }
      >
        {/* Routed Views */}
        {activeView === 'home' && <HomeLandingPage />}
        {activeView === 'calculator' && <CalculatorDashboard />}
        {activeView === 'catalog' && <CatalogDirectory />}
        {activeView === 'product' && <ProductDetailView />}
        {activeView === 'compare' && <ComparisonDashboard />}
        {activeView === 'tracker' && <PriceTrackerDashboard />}
        {activeView === 'report' && <InstallerReportView />}
        {activeView === 'assistant' && <AssistantHub />}
        {activeView === 'signup' && <SignUpPage />}
      </main>

      {/* Quiet Editorial Footer mirroring all links */}
      <footer className="no-print border-t border-slate-200 bg-white pb-16 lg:pb-0">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="text-base font-bold text-slate-900 font-display"
            >
              {t.brandTitle}
            </button>
            <p className="mt-1 text-xs text-slate-500">
              © {new Date().getFullYear()} IbexProjectorsIndia · India Projector Database &amp; Optical Room Planner
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
            <button type="button" onClick={() => handleNavClick('home')} className="hover:text-slate-900">
              {t.navHome}
            </button>
            <button type="button" onClick={() => handleNavClick('calculator')} className="hover:text-slate-900">
              {t.navCalculator}
            </button>
            <button type="button" onClick={() => handleNavClick('catalog')} className="hover:text-slate-900">
              {t.navCatalog}
            </button>
            <button type="button" onClick={() => handleNavClick('compare')} className="hover:text-slate-900">
              {t.navCompare}
            </button>
            <button type="button" onClick={() => handleNavClick('tracker')} className="hover:text-slate-900">
              {t.navTracker}
            </button>
            <button type="button" onClick={() => handleNavClick('report')} className="hover:text-slate-900">
              {t.navReport}
            </button>
            <button type="button" onClick={() => handleNavClick('assistant')} className="hover:text-slate-900">
              Ask Advisor
            </button>
            <button type="button" onClick={() => handleNavClick('signup')} className="hover:text-slate-900">
              {user ? 'Account' : 'Sign Up'}
            </button>
            <a
              href={SUBSTACK_NEWSLETTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 inline-flex items-center gap-1 text-blue-700"
            >
              <span>Substack Newsletter</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Compact Mobile Bottom Nav (<= 56px height, well within <=15% sticky budget) */}
      <nav
        aria-label="Mobile quick navigation"
        className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white border-t border-slate-200 grid grid-cols-5"
      >
        {mobileBottomLinks.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeView === item.id || (activeView === 'product' && item.id === 'catalog');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                isActive ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[68px]">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Extensible E-Commerce Quote Bag Drawer */}
      <QuoteBagDrawer />

      {/* Offline Connectivity Banner */}
      <OfflineIndicator />

      {/* Lightweight Toast Notification */}
      {toast && (
        <div
          role="status"
          className="no-print fixed bottom-16 lg:bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-slate-700"
        >
          {toast.text}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <DashboardShell />
      </AppProvider>
    </ErrorBoundary>
  );
}

import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-1.5 text-xs font-medium' : 'w-full px-3.5 py-2 text-xs font-medium'
        }`}
      >
        {isIOS ? <Smartphone className="w-3.5 h-3.5 text-blue-700" /> : <Download className="w-3.5 h-3.5 text-blue-700" />}
        <span>{isInstallable ? 'Install App' : isIOS ? 'Install on iOS' : 'Android / iOS App'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Install IbexProjectorsIndia on Mobile
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Run full offline optical calculations on Android, iOS, or via Capacitor APK.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="pb-4 border-b border-slate-100">
                <p className="font-medium text-slate-900">Instant Trial on Android (Chrome)</p>
                <ol className="mt-1.5 space-y-1 text-xs text-slate-600 list-decimal list-inside">
                  <li>Open the app URL in Chrome on your Android phone.</li>
                  <li>Tap the <strong>three-dot menu</strong> in the top right and select <strong>Install app</strong>.</li>
                  <li>Launches fullscreen like a native Android app with offline support.</li>
                </ol>
              </div>
              <div className="pb-4 border-b border-slate-100">
                <p className="font-medium text-slate-900">On iPhone / iPad (Safari)</p>
                <ol className="mt-1.5 space-y-1 text-xs text-slate-600 list-decimal list-inside">
                  <li>Tap the <strong>Share</strong> icon in Safari&apos;s bottom toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> for standalone offline access.</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-slate-900">Standalone Android APK Build</p>
                <p className="mt-1 text-xs text-slate-600">
                  This project includes a pre-configured Capacitor Android project and GitHub Actions APK build workflow (<code className="font-mono">ANDROID_APK_GUIDE.md</code>).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="no-print fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Room Planner &amp; Projector Catalog remain fully active.</span>
    </div>
  );
};

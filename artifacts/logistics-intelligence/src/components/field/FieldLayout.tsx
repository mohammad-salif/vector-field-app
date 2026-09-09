import { useState, useEffect } from 'react';
import {
  Compass,
  AlertTriangle,
  FileText,
  Shield,
  UserCheck,
  Package,
  Route as RouteIcon,
  BellRing,
  PlusCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Bluetooth,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  syncManager,
  bluetoothTransport,
  type ConnectivityStatus,
  type BluetoothConnectionState,
} from '@/services/offline';
import { FieldBluetoothRelayModal } from './FieldBluetoothRelayModal';

export type FieldScreenKey =
  | 'home'
  | 'delivery'
  | 'route'
  | 'alerts'
  | 'my-reports'
  | 'report'
  | 'detail'
  | 'profile';

interface FieldLayoutProps {
  currentScreen: FieldScreenKey;
  activeAlertCount?: number;
  onNavigate: (screen: FieldScreenKey) => void;
  children: ReactNode;
}

export function FieldLayout({
  currentScreen,
  activeAlertCount = 0,
  onNavigate,
  children,
}: FieldLayoutProps) {
  const [connStatus, setConnStatus] = useState<ConnectivityStatus>({
    state: typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    message: 'Connected',
  });
  const [btState, setBtState] = useState<BluetoothConnectionState>(bluetoothTransport.getState());
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);

  useEffect(() => {
    const unsubscribeSync = syncManager.subscribe((status) => {
      setConnStatus(status);
    });
    const unsubscribeBt = bluetoothTransport.subscribeState((state) => {
      setBtState(state);
    });
    return () => {
      unsubscribeSync();
      unsubscribeBt();
    };
  }, []);

  return (
    <div className="flex h-screen h-dvh flex-col overflow-hidden bg-neutral-100/70 text-neutral-900">
      {/* Top Header */}
      <header className="shrink-0 border-b border-neutral-200/90 bg-white/95 backdrop-blur-md z-40 shadow-xs">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
              <Shield className="h-5 w-5 text-neutral-800" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="truncate text-sm font-bold text-neutral-900">Field Officer App</span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                  <UserCheck className="h-3 w-3 text-neutral-600" />
                  Unit 4
                </span>
              </div>
              <div className="flex items-center gap-2">
                {connStatus.state === 'OFFLINE' ? (
                  <span
                    id="header-offline-indicator"
                    className="flex items-center gap-1 truncate text-[11px] font-semibold text-amber-700"
                    title="Operating offline. All reports will be saved locally."
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>
                      {connStatus.pendingCount > 0
                        ? `Offline • ${connStatus.pendingCount} saved on device`
                        : 'Offline • Reports saved on device'}
                    </span>
                  </span>
                ) : connStatus.state === 'PENDING_SYNC' ? (
                  <span
                    id="header-pending-sync-indicator"
                    className="flex items-center gap-1 truncate text-[11px] font-semibold text-blue-700"
                    title="Connected. Reports waiting to sync with backend endpoint."
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    <span>
                      {connStatus.pendingCount === 1
                        ? '1 report waiting to sync'
                        : `${connStatus.pendingCount} reports waiting to sync`}
                    </span>
                  </span>
                ) : connStatus.state === 'SYNCING' ? (
                  <span className="flex items-center gap-1 truncate text-[11px] font-medium text-neutral-600">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin text-neutral-500" />
                    <span>Syncing...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 truncate text-[11px] text-neutral-500">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>Connected • Officer Rawat</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Bluetooth Store-and-Forward Relay Trigger */}
            <button
              type="button"
              id="btn-header-bluetooth"
              onClick={() => setShowBluetoothModal(true)}
              data-testid="button-header-bluetooth"
              aria-label="Open Bluetooth Store-and-Forward Relay"
              title={`Bluetooth Relay: ${btState}`}
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 shadow-2xs transition-all active:scale-95"
            >
              <Bluetooth className="h-4 w-4 text-blue-600" />
              <span
                className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${
                  btState === 'Connected'
                    ? 'bg-emerald-500'
                    : btState === 'Bluetooth available'
                    ? 'bg-blue-500'
                    : btState === 'Scanning' || btState === 'Connecting'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-neutral-400'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('report')}
              data-testid="button-header-quick-report"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-neutral-900 bg-neutral-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-[0.98] hover:bg-black sm:px-3 sm:py-2"
              title="Report road disruption or incident"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Report</span>
            </button>

            {/* Field Officer Profile Avatar Control */}
            <button
              type="button"
              id="btn-header-profile-avatar"
              onClick={() => onNavigate('profile')}
              data-testid="button-header-profile"
              aria-label="Open Field Officer Profile"
              title="Field Officer Profile & Account Settings"
              className={`relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border transition-all active:scale-95 ${
                currentScreen === 'profile'
                  ? 'border-neutral-900 bg-neutral-900 text-white ring-2 ring-neutral-900 ring-offset-2'
                  : 'border-neutral-300 bg-neutral-900 text-white hover:border-neutral-500 shadow-2xs'
              }`}
            >
              <span className="font-mono text-[11px] sm:text-xs font-black tracking-tight">VR</span>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Body - vertically scrollable owner */}
      <main className="mx-auto w-full max-w-3xl flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3.5 pb-24 sm:px-4 sm:py-5 sm:pb-28 overscroll-contain">
        {children}
      </main>

      {/* Bottom Conceptual Navigation Bar */}
      <nav
        aria-label="Field Application Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-md shadow-md"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-1 py-1 sm:px-2 sm:py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
          {/* 1. HOME */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-current={currentScreen === 'home' ? 'page' : undefined}
            data-testid="nav-field-home"
            className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
              currentScreen === 'home'
                ? 'text-neutral-950 font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Compass className={`h-4 w-4 sm:h-5 sm:w-5 ${currentScreen === 'home' ? 'text-neutral-950' : 'text-neutral-500'}`} />
            <span className="whitespace-nowrap">Home</span>
          </button>

          {/* 2. MY DELIVERY */}
          <button
            type="button"
            onClick={() => onNavigate('delivery')}
            aria-current={currentScreen === 'delivery' ? 'page' : undefined}
            data-testid="nav-field-delivery"
            className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
              currentScreen === 'delivery'
                ? 'text-neutral-950 font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Package className={`h-4 w-4 sm:h-5 sm:w-5 ${currentScreen === 'delivery' ? 'text-neutral-950' : 'text-neutral-500'}`} />
            <span className="whitespace-nowrap">My Delivery</span>
          </button>

          {/* 3. MY ROUTE */}
          <button
            type="button"
            onClick={() => onNavigate('route')}
            aria-current={currentScreen === 'route' ? 'page' : undefined}
            data-testid="nav-field-route"
            className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
              currentScreen === 'route'
                ? 'text-neutral-950 font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <RouteIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${currentScreen === 'route' ? 'text-neutral-950' : 'text-neutral-500'}`} />
            <span className="whitespace-nowrap">My Route</span>
          </button>

          {/* 4. ALERTS */}
          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            aria-current={currentScreen === 'alerts' ? 'page' : undefined}
            data-testid="nav-field-alerts"
            className={`relative flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
              currentScreen === 'alerts'
                ? 'text-neutral-950 font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className="relative">
              <BellRing className={`h-4 w-4 sm:h-5 sm:w-5 ${currentScreen === 'alerts' ? 'text-neutral-950' : 'text-neutral-500'}`} />
              {activeAlertCount > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white">
                  {activeAlertCount}
                </span>
              )}
            </div>
            <span className="whitespace-nowrap">Alerts</span>
          </button>

          {/* 5. MY REPORTS */}
          <button
            type="button"
            onClick={() => onNavigate('my-reports')}
            aria-current={currentScreen === 'my-reports' || currentScreen === 'detail' ? 'page' : undefined}
            data-testid="nav-field-my-reports"
            className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
              currentScreen === 'my-reports' || currentScreen === 'detail'
                ? 'text-neutral-950 font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <FileText className={`h-4 w-4 sm:h-5 sm:w-5 ${currentScreen === 'my-reports' || currentScreen === 'detail' ? 'text-neutral-950' : 'text-neutral-500'}`} />
            <span className="whitespace-nowrap">My Reports</span>
          </button>
        </div>
      </nav>

      {/* Bluetooth Store-and-Forward Modal */}
      <FieldBluetoothRelayModal
        isOpen={showBluetoothModal}
        onClose={() => setShowBluetoothModal(false)}
      />
    </div>
  );
}

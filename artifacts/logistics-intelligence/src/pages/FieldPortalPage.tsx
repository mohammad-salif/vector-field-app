import { useState, useMemo, useEffect } from 'react';
import type { Incident } from '@/types';
import { getAllIncidents, hydrateOfflineIncidents } from '@/services/incidentService';
import { getFleetVehicleById } from '@/services/fleetService';
import { getDeliveryById } from '@/services/deliveryService';
import { getRouteById } from '@/services/mapService';
import { getAlerts } from '@/services/alertService';
import {
  isSessionAuthenticated,
  setSessionAuthenticated,
} from '@/services/authService';
import { FieldLayout, type FieldScreenKey } from '@/components/field/FieldLayout';
import { FieldHomeView } from '@/components/field/FieldHomeView';
import { FieldDeliveryView } from '@/components/field/FieldDeliveryView';
import { FieldRouteView } from '@/components/field/FieldRouteView';
import { FieldAlertsView } from '@/components/field/FieldAlertsView';
import { FieldReportIncidentView } from '@/components/field/FieldReportIncidentView';
import { FieldMyReportsView } from '@/components/field/FieldMyReportsView';
import { FieldIncidentDetailView } from '@/components/field/FieldIncidentDetailView';
import { FieldProfileView } from '@/components/field/FieldProfileView';
import { FieldLoginView } from '@/components/field/FieldLoginView';

interface FieldPortalPageProps {
  onSwitchToAdmin?: () => void;
}

export function FieldPortalPage({ onSwitchToAdmin }: FieldPortalPageProps = {}) {
  // Authentication Adapter State (App Launch -> Login -> Authenticated Field User -> Home)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isSessionAuthenticated());
  const [currentScreen, setCurrentScreen] = useState<FieldScreenKey>('home');
  const [previousScreen, setPreviousScreen] = useState<FieldScreenKey>('home');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Reactive incidents store with persistent offline hydration
  const [incidentsList, setIncidentsList] = useState<Incident[]>(() => getAllIncidents());

  useEffect(() => {
    hydrateOfflineIncidents().then((hydrated) => {
      setIncidentsList([...hydrated]);
    });
  }, []);

  // Field Operator Context: Officer V. Rawat (Field Unit 4)
  // Assigned: Vehicle VHC-2044, Delivery DLV-6006, Route RTE-104 (Corridor Delta)
  const assignedVehicle = useMemo(() => {
    return (
      getFleetVehicleById('VHC-2044') || {
        id: 'VHC-2044',
        type: 'Flatbed Truck' as const,
        cargoCategory: 'General Freight' as const,
        origin: 'Westfield Center',
        destination: 'Southport Depot',
        status: 'Offline' as const,
        routeStatus: 'blocked' as const,
        eta: 'TBD',
        lastUpdated: '1 hr ago',
        operationalNote: 'Vehicle stationary on Corridor Delta due to road blockage.',
      }
    );
  }, []);

  const assignedDelivery = useMemo(() => {
    return (
      getDeliveryById('DLV-6006') || {
        id: 'DLV-6006',
        commodity: 'Food' as const,
        origin: 'Westfield Center',
        destination: 'Southport Depot',
        vehicleId: 'VHC-2044',
        routeId: 'RTE-104',
        status: 'At Risk' as const,
        eta: 'TBD',
      }
    );
  }, []);

  const assignedRoute = useMemo(() => {
    return (
      getRouteById('RTE-104') || {
        id: 'RTE-104',
        label: 'Corridor Delta',
        points: [],
        status: 'blocked' as const,
        riskLevel: 'critical' as const,
        riskScore: 96,
        distance: '198 km',
        estimatedTravelTime: 'N/A — Route Blocked',
        alternativeAvailable: true,
        alternativeRouteId: 'ALT-104',
        alternativeTravelTime: '6h 20m',
        origin: 'Westfield Center',
        destination: 'Southport Depot',
      }
    );
  }, []);

  // Filter ONLY alerts relevant to the logged-in field operator (VHC-2044 / RTE-104 / DLV-6006)
  const userRelevantAlerts = useMemo(() => {
    const rawAlerts = getAlerts();
    return rawAlerts.filter(
      (a) =>
        a.routeId === 'RTE-104' ||
        a.vehicleId === 'VHC-2044' ||
        a.deliveryId === 'DLV-6006',
    );
  }, []);

  // Filter ONLY reports created by the current field user (Officer Rawat / Unit 4 / Corridor Delta)
  const userIncidents = useMemo(() => {
    return incidentsList.filter(
      (i) =>
        i.reportedBy?.includes('Officer V. Rawat') ||
        i.reportedBy?.includes('Unit 4') ||
        i.routeId === 'RTE-104' ||
        i.location.includes('Corridor Delta'),
    );
  }, [incidentsList]);

  // Incidents specifically occurring on the assigned route (for Route Risk view)
  const routeIncidents = useMemo(() => {
    return incidentsList.filter(
      (i) => i.routeId === 'RTE-104' || i.location.includes('Corridor Delta'),
    );
  }, [incidentsList]);

  // Currently selected incident for detail inspection
  const selectedIncident = useMemo(() => {
    if (!selectedIncidentId) return null;
    return incidentsList.find((i) => i.id === selectedIncidentId) || null;
  }, [incidentsList, selectedIncidentId]);

  function handleNavigate(screen: FieldScreenKey) {
    if (screen !== 'detail') {
      setSelectedIncidentId(null);
    }
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
  }

  function handleSelectIncident(id: string) {
    setSelectedIncidentId(id);
    setPreviousScreen(currentScreen);
    setCurrentScreen('detail');
  }

  function handleSubmitted(newIncident: Incident) {
    setIncidentsList(getAllIncidents());
    setSelectedIncidentId(newIncident.id);
    setPreviousScreen('my-reports');
    setCurrentScreen('detail');
  }

  function handleLoginSuccess(_officerId: string) {
    setSessionAuthenticated(true);
    setIsAuthenticated(true);
    setCurrentScreen('home');
  }

  function handleLogout() {
    setSessionAuthenticated(false);
    setIsAuthenticated(false);
    setCurrentScreen('home');
  }

  const activeAlertsCount = userRelevantAlerts.filter((a) => a.status === 'Active').length;

  // APP FLOW: App Launch -> Login -> Authenticated Field User -> Field User Home
  if (!isAuthenticated) {
    return <FieldLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <FieldLayout
      currentScreen={currentScreen}
      activeAlertCount={activeAlertsCount}
      onNavigate={handleNavigate}
    >
      {/* 1. HOME SCREEN */}
      {currentScreen === 'home' && (
        <FieldHomeView
          vehicle={assignedVehicle}
          delivery={assignedDelivery}
          route={assignedRoute}
          activeAlerts={userRelevantAlerts}
          userIncidents={userIncidents}
          onReportClick={() => {
            setPreviousScreen('home');
            setCurrentScreen('report');
          }}
          onDeliveryClick={() => setCurrentScreen('delivery')}
          onRouteChangeClick={() => setCurrentScreen('route')}
          onAlertsClick={() => setCurrentScreen('alerts')}
          onMyReportsClick={() => setCurrentScreen('my-reports')}
          onSelectIncident={handleSelectIncident}
        />
      )}

      {/* 2. MY DELIVERY SCREEN */}
      {currentScreen === 'delivery' && (
        <FieldDeliveryView
          delivery={assignedDelivery}
          vehicle={assignedVehicle}
          route={assignedRoute}
          onViewRoute={() => setCurrentScreen('route')}
          onReportIncident={() => {
            setPreviousScreen('delivery');
            setCurrentScreen('report');
          }}
        />
      )}

      {/* 3. MY ROUTE / ROUTE RISK SCREEN */}
      {currentScreen === 'route' && (
        <FieldRouteView
          route={assignedRoute}
          vehicle={assignedVehicle}
          incidentsOnRoute={routeIncidents}
          onReportIncident={() => {
            setPreviousScreen('route');
            setCurrentScreen('report');
          }}
          onSelectIncident={handleSelectIncident}
        />
      )}

      {/* 4. ALERTS SCREEN */}
      {currentScreen === 'alerts' && (
        <FieldAlertsView
          alerts={userRelevantAlerts}
          onReportIncident={() => {
            setPreviousScreen('alerts');
            setCurrentScreen('report');
          }}
          onViewRoute={() => setCurrentScreen('route')}
          onViewDelivery={() => setCurrentScreen('delivery')}
          onViewIncident={(incidentId: string) => handleSelectIncident(incidentId)}
        />
      )}

      {/* 5. MY REPORTS SCREEN */}
      {currentScreen === 'my-reports' && (
        <FieldMyReportsView
          incidents={userIncidents}
          onSelectIncident={handleSelectIncident}
          onNewReport={() => {
            setPreviousScreen('my-reports');
            setCurrentScreen('report');
          }}
        />
      )}

      {/* 6. REPORT INCIDENT SCREEN */}
      {currentScreen === 'report' && (
        <FieldReportIncidentView
          onBack={() => setCurrentScreen(previousScreen || 'home')}
          onSubmitted={handleSubmitted}
        />
      )}

      {/* 7. INCIDENT DETAIL SCREEN */}
      {currentScreen === 'detail' && (
        selectedIncident ? (
          <FieldIncidentDetailView
            incident={selectedIncident}
            onBack={() => setCurrentScreen(previousScreen === 'detail' ? 'my-reports' : previousScreen)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-xs">
            <p className="text-sm font-semibold text-neutral-800">Incident Record Not Found</p>
            <p className="text-xs text-neutral-500">The selected report could not be located in current records.</p>
            <button
              type="button"
              onClick={() => setCurrentScreen('my-reports')}
              className="mt-2 rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-black"
            >
              Return to My Reports
            </button>
          </div>
        )
      )}

      {/* 8. PROFILE & ACCOUNT SCREEN */}
      {currentScreen === 'profile' && (
        <FieldProfileView
          vehicle={assignedVehicle}
          delivery={assignedDelivery}
          route={assignedRoute}
          onBack={() => setCurrentScreen(previousScreen === 'profile' ? 'home' : previousScreen)}
          onViewDelivery={() => setCurrentScreen('delivery')}
          onViewRoute={() => setCurrentScreen('route')}
          onLogout={handleLogout}
        />
      )}
    </FieldLayout>
  );
}

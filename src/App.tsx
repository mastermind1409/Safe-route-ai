import { useState, useEffect, useRef, useCallback } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type {
  Coordinates,
  Route,
  Hazard,
  HazardReport,
  ToastMessage,
  EmergencyState,
} from './types';
import { allRoutes as initialRoutes, safeRoute } from './data/mockRoutes';
import { findNearbyHazardIds } from './utils/haversine';
import { recalculateRouteScore, computeSafetyBreakdown } from './utils/safetyScorer';

import Navbar from './components/Navbar';
import type { ActiveTab } from './components/Navbar';
import SafetyMap from './components/Map/SafetyMap';
import SafetyDashboard from './components/Dashboard/SafetyDashboard';
import RouteCard from './components/Sidebar/RouteCard';
import SafetyAudit from './components/Sidebar/SafetyAudit';
import HazardList from './components/Sidebar/HazardList';
import ReportModal from './components/Modals/ReportModal';
import SOSDrawer from './components/Modals/SOSDrawer';
import Toast from './components/Common/Toast';
import { MapPin, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';

// Penalty lookup by hazard type
const HAZARD_PENALTIES: Record<string, number> = {
  dark_stretch: 15,
  broken_streetlight: 8,
  harassment_concern: 25,
};

export default function App() {
  // ─── Core State ───────────────────────────────────────────
  const mapRef = useRef<LeafletMap | null>(null);
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(safeRoute.id);
  const [extraHazards, setExtraHazards] = useState<Hazard[]>([]);

  // ─── GPS State ────────────────────────────────────────────
  const [userPosition, setUserPosition] = useState<Coordinates | null>(null);
  const [gpsActive, setGpsActive] = useState(false);

  // ─── Simulation State ─────────────────────────────────────
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const [simPosition, setSimPosition] = useState<Coordinates | null>(null);
  const triggeredHazardIds = useRef<Set<string>>(new Set());

  // ─── Modals & Toasts ──────────────────────────────────────
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [pendingPinPosition, setPendingPinPosition] = useState<Coordinates | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ─── SOS ──────────────────────────────────────────────────
  const [sos, setSos] = useState<EmergencyState>({
    active: false,
    countdown: 10,
    lastKnownPosition: null,
    triggeredAt: null,
  });
  const isSOSOpen = sos.active;

  // ─── Mobile sidebar ───────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');

  // ─── Map Camera ────────────────────────────────────────────
  const [mapFlyTo, setMapFlyTo] = useState<Coordinates | null>(null);

  // ─── Derived ──────────────────────────────────────────────
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? routes[0];
  const breakdown = computeSafetyBreakdown(selectedRoute);
  const allHazards: Hazard[] = [
    ...routes.flatMap((r) => r.hazards),
    ...extraHazards,
  ];

  // ─── Toast helper ─────────────────────────────────────────
  const addToast = useCallback(
    (message: string, type: ToastMessage['type'] = 'warning') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, type, timestamp: Date.now() }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── GPS Tracking ─────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setGpsActive(true);
      },
      () => {
        setGpsActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ─── Walk Simulation ──────────────────────────────────────
  useEffect(() => {
    if (!isSimulating) {
      setSimPosition(null);
      setSimStepIndex(0);
      triggeredHazardIds.current.clear();
      return;
    }

    const coords = selectedRoute.coordinates;
    if (simStepIndex >= coords.length) {
      setIsSimulating(false);
      addToast('Simulation complete — you reached your destination.', 'success');
      return;
    }

    const currentPos = coords[simStepIndex];
    setSimPosition(currentPos);

    // Proximity checks with deduplication
    const nearbyIds = findNearbyHazardIds(currentPos, allHazards, 120);
    for (const hid of nearbyIds) {
      if (!triggeredHazardIds.current.has(hid)) {
        triggeredHazardIds.current.add(hid);
        const hazard = allHazards.find((h) => h.id === hid);
        if (hazard) {
          addToast(
            `⚠ Approaching hazard: ${hazard.label} (${Math.round(120)}m radius)`,
            'warning'
          );
        }
      }
    }

    // Check safe hubs proximity
    const allSafeHubs = routes.flatMap((r) => r.safeHubs);
    const nearbyHubIds = findNearbyHazardIds(currentPos, allSafeHubs, 150);
    for (const sid of nearbyHubIds) {
      const key = `hub-${sid}`;
      if (!triggeredHazardIds.current.has(key)) {
        triggeredHazardIds.current.add(key);
        const hub = allSafeHubs.find((h) => h.id === sid);
        if (hub) {
          addToast(`✓ Near safe hub: ${hub.name}`, 'success');
        }
      }
    }

    const timer = setTimeout(() => {
      setSimStepIndex((prev) => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isSimulating, simStepIndex, selectedRoute, allHazards, routes, addToast]);

  // ─── SOS Countdown ────────────────────────────────────────
  useEffect(() => {
    if (!sos.active || sos.countdown <= 0) return;
    const timer = setInterval(() => {
      setSos((prev) => ({
        ...prev,
        countdown: prev.countdown - 1,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [sos.active, sos.countdown]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleMapClick = useCallback((position: Coordinates) => {
    setPendingPinPosition(position);
  }, []);

  const handleReportSubmit = useCallback(
    (report: HazardReport) => {
      if (!report.position) return;

      const newHazard: Hazard = {
        id: `user-h-${Date.now()}`,
        type: report.type,
        label: `User-reported: ${report.type.replace(/_/g, ' ')}`,
        position: report.position,
        severity: report.severity,
        reportedAt: new Date().toISOString(),
        upvotes: 1,
        penalty: HAZARD_PENALTIES[report.type] ?? 10,
      };

      setExtraHazards((prev) => [...prev, newHazard]);

      // Recalculate route scores if hazard is near a route
      setRoutes((prev) =>
        prev.map((route) => {
          const nearRoute = findNearbyHazardIds(report.position!, route.coordinates.map((c) => ({ id: 'tmp', position: c })), 200);
          if (nearRoute.length > 0) {
            const updated = {
              ...route,
              hazards: [...route.hazards, newHazard],
            };
            return recalculateRouteScore(updated);
          }
          return route;
        })
      );

      addToast('Hazard reported — map and safety scores updated.', 'info');
      setPendingPinPosition(null);
    },
    [addToast]
  );

  const handleUpvote = useCallback((hazardId: string) => {
    setRoutes((prev) =>
      prev.map((route) => ({
        ...route,
        hazards: route.hazards.map((h) =>
          h.id === hazardId ? { ...h, upvotes: h.upvotes + 1 } : h
        ),
      }))
    );
    setExtraHazards((prev) =>
      prev.map((h) => (h.id === hazardId ? { ...h, upvotes: h.upvotes + 1 } : h))
    );
  }, []);

  const handleSOSTrigger = useCallback(() => {
    setSos({
      active: true,
      countdown: 10,
      lastKnownPosition: userPosition ?? simPosition,
      triggeredAt: new Date().toISOString(),
    });
  }, [userPosition, simPosition]);

  const handleSOSCancel = useCallback(() => {
    setSos({ active: false, countdown: 10, lastKnownPosition: null, triggeredAt: null });
  }, []);

  const handleSOSConfirm = useCallback(() => {
    addToast('🚨 Emergency SOS dispatched! Emergency contacts notified.', 'warning');
    setSos({ active: false, countdown: 10, lastKnownPosition: null, triggeredAt: null });
  }, [addToast]);

  const handleToggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  const handleShowHazardOnMap = useCallback((position: Coordinates) => {
    setMapFlyTo([...position]);
    setActiveTab('map');
  }, []);

  const handleSelectRoute = useCallback(
    (id: string) => {
      setSelectedRouteId(id);
      const route = routes.find((r) => r.id === id);
      if (route && route.coordinates.length > 0) {
        const mid = route.coordinates[Math.floor(route.coordinates.length / 2)];
        setMapFlyTo([...mid]);
      }
    },
    [routes]
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-canvas">
      {/* Top Bar */}
      <Navbar
        gpsActive={gpsActive}
        simulating={isSimulating}
        activeTab={activeTab}
        onToggleSimulation={handleToggleSimulation}
        onSOS={handleSOSTrigger}
        onTabChange={setActiveTab}
      />

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className={`absolute inset-0 flex overflow-hidden ${
            activeTab === 'map' ? 'visible' : 'invisible pointer-events-none'
          }`}
          aria-hidden={activeTab !== 'map'}
        >
        {/* Left Sidebar — Desktop */}
        <aside className="hidden lg:flex w-[420px] shrink-0 flex-col border-r border-border-light bg-canvas overflow-hidden">
          <div className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-4">
            {/* Origin / Destination Header */}
            <div className="bg-surface border border-border-light rounded-lg p-4">
              <h3 className="text-xs font-semibold text-slate-heading uppercase tracking-wider mb-3">
                Route Planner
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  T. Nagar Bus Terminus
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-800">
                  <MapPin className="w-3.5 h-3.5" />
                  Pondy Bazaar Junction
                </div>
              </div>
            </div>

            {/* Route Comparison Cards */}
            <div>
              <h4 className="text-xs font-semibold text-slate-heading uppercase tracking-wider mb-2 px-1">
                Compare Routes
              </h4>
              <div className="space-y-2">
                {routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={route.id === selectedRouteId}
                    onSelect={handleSelectRoute}
                  />
                ))}
              </div>
            </div>

            {/* Safety Audit */}
            <SafetyAudit breakdown={breakdown} />

            {/* Report Hazard Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand-crimson text-brand-crimson text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Report Hazard
            </button>

            {/* Hazard Feed */}
            <HazardList hazards={allHazards} onUpvote={handleUpvote} />
          </div>
        </aside>

        {/* Mobile Bottom Sheet Toggle */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 z-[1000]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-1 py-2 bg-surface border-t border-border-light text-xs font-medium text-slate-muted"
          >
            {sidebarOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            {sidebarOpen ? 'Collapse Panel' : 'Route Details'}
          </button>
          {sidebarOpen && (
            <div className="bg-canvas border-t border-border-light max-h-[55vh] overflow-y-auto sidebar-scroll p-4 space-y-4">
              <div className="space-y-2">
                {routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={route.id === selectedRouteId}
                    onSelect={handleSelectRoute}
                  />
                ))}
              </div>
              <SafetyAudit breakdown={breakdown} />
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-brand-crimson text-brand-crimson text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Report Hazard
              </button>
              <HazardList hazards={allHazards} onUpvote={handleUpvote} />
            </div>
          )}
        </div>

        {/* Right Panel — Map */}
        <SafetyMap
          mapRef={mapRef}
          routes={routes}
          selectedRouteId={selectedRouteId}
          userPosition={userPosition}
          simPosition={simPosition}
          isSimulating={isSimulating}
          extraHazards={extraHazards}
          flyToCenter={mapFlyTo}
          onMapClick={handleMapClick}
          onSelectRoute={handleSelectRoute}
        />
      </div>
        <div
          className={`absolute inset-0 ${
            activeTab === 'dashboard' ? 'visible' : 'invisible pointer-events-none'
          }`}
          aria-hidden={activeTab !== 'dashboard'}
        >
          <SafetyDashboard hazards={allHazards} onShowOnMap={handleShowHazardOnMap} />
        </div>
      </div>

      {/* Modals & Overlays */}
      <ReportModal
        open={isReportModalOpen}
        selectedPosition={pendingPinPosition}
        onClose={() => {
          setIsReportModalOpen(false);
          setPendingPinPosition(null);
        }}
        onSubmit={handleReportSubmit}
      />

      <SOSDrawer
        open={isSOSOpen}
        countdown={sos.countdown}
        userPosition={userPosition ?? simPosition}
        onCancel={handleSOSCancel}
        onConfirm={handleSOSConfirm}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

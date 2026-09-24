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
import { MapPin, AlertTriangle, ChevronUp, ChevronDown, Search, LoaderCircle } from 'lucide-react';

// Penalty lookup by hazard type
const HAZARD_PENALTIES: Record<string, number> = {
  dark_stretch: 15,
  broken_streetlight: 8,
  harassment_concern: 25,
};

function parseCoordinates(value: string): Coordinates | null {
  const parts = value.split(',').map((part) => Number(part.trim()));
  return parts.length === 2 &&
    parts.every((part) => Number.isFinite(part)) &&
    parts[0] >= -90 &&
    parts[0] <= 90 &&
    parts[1] >= -180 &&
    parts[1] <= 180
    ? [parts[0], parts[1]]
    : null;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface PhotonResult {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const commonLocationCorrections: Record<string, string> = {
  chenai: 'Chennai',
  chennaii: 'Chennai',
  banglore: 'Bangalore',
  bengaluruu: 'Bengaluru',
  hydrabad: 'Hyderabad',
  hyderbad: 'Hyderabad',
  mumabi: 'Mumbai',
  bombay: 'Mumbai',
  delhii: 'Delhi',
  kolkatta: 'Kolkata',
  coimbatoree: 'Coimbatore',
  pondybazaar: 'Pondy Bazaar, Chennai',
};

function correctedLocationQuery(value: string): string {
  return value
    .split(/\s*,\s*/)
    .map((part) => commonLocationCorrections[part.trim().toLowerCase()] ?? part.trim())
    .join(', ');
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function geocodePlace(value: string): Promise<{ position: Coordinates; label: string }> {
  const coordinates = parseCoordinates(value);
  if (coordinates) return { position: coordinates, label: value };

  const correctedValue = correctedLocationQuery(value);
  const queries = [...new Set([
    `${correctedValue}, India`,
    correctedValue,
    `${value}, India`,
    value,
  ])];
  for (const query of queries) {
    try {
      const response = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&accept-language=en&q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const results = (await response.json()) as NominatimResult[];
        const result = results[0];
        if (result) {
          return {
            position: [Number(result.lat), Number(result.lon)],
            label: result.display_name.split(',').slice(0, 3).join(','),
          };
        }
      }
    } catch {
      // Try the secondary public geocoder below.
    }
  }

  try {
    const response = await fetchWithTimeout(
        `https://photon.komoot.io/api/?limit=1&lang=en&lat=20.5937&lon=78.9629&q=${encodeURIComponent(correctedValue)}`
    );
    if (response.ok) {
      const results = (await response.json()) as { features?: PhotonResult[] };
      const result = results.features?.[0];
      if (result) {
        const { name, city, state, country } = result.properties;
        return {
          position: [result.geometry.coordinates[1], result.geometry.coordinates[0]],
          label: [name, city, state, country].filter(Boolean).slice(0, 3).join(', '),
        };
      }
    }
  } catch {
    // Surface one actionable error instead of silently creating a bad route.
  }

  throw new Error(`Location not found. Try a nearby landmark, city, or "latitude, longitude".`);
}

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
  const [originInput, setOriginInput] = useState('T. Nagar Bus Terminus, Chennai');
  const [destinationInput, setDestinationInput] = useState('Pondy Bazaar Junction, Chennai');
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

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

  const handleDemoMode = useCallback(() => {
    setActiveTab('map');
    setSelectedRouteId(safeRoute.id);
    setMapFlyTo([...safeRoute.coordinates[Math.floor(safeRoute.coordinates.length / 2)]]);
    setIsSimulating(true);
    addToast('Demo Mode started — watch the safe route, hazard alerts, and SOS flow.', 'info');
  }, [addToast]);

  const handlePlanRoute = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!originInput.trim() || !destinationInput.trim()) {
      addToast('Enter both an origin and destination to plan a route.', 'warning');
      return;
    }

    setIsPlanningRoute(true);
    try {
      const [origin, destination] = await Promise.all([
        geocodePlace(originInput.trim()),
        geocodePlace(destinationInput.trim()),
      ]);
      setOriginInput(origin.label);
      setDestinationInput(destination.label);
      const steps = 24;
      const coordinates = Array.from({ length: steps + 1 }, (_, index) => {
        const ratio = index / steps;
        return [
          origin.position[0] + (destination.position[0] - origin.position[0]) * ratio,
          origin.position[1] + (destination.position[1] - origin.position[1]) * ratio,
        ] as Coordinates;
      });
      const generatedRoute: Route = {
        id: 'custom-route',
        name: `${origin.label} to ${destination.label}`,
        tag: 'Your route',
        distance: Math.round(Math.hypot(
          (destination.position[0] - origin.position[0]) * 111000,
          (destination.position[1] - origin.position[1]) * 108000
        )),
        walkTime: Math.max(1, Math.round(coordinates.length * 0.7)),
        coordinates,
        safetyScore: 82,
        hazards: [],
        safeHubs: [],
        lightingRatio: 0.78,
        color: '#2563EB',
        dashArray: undefined,
        recommended: true,
      };
      setRoutes((previous) => [generatedRoute, ...previous.filter((route) => route.id !== generatedRoute.id)]);
      setSelectedRouteId(generatedRoute.id);
      setMapFlyTo([...origin.position]);
      addToast('Your route is ready. Select another route below to compare.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to plan this route.', 'warning');
    } finally {
      setIsPlanningRoute(false);
    }
  }, [addToast, destinationInput, originInput]);

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
    <div className={`h-screen flex flex-col overflow-hidden bg-canvas ${highContrast ? 'high-contrast' : ''}`}>
      {/* Top Bar */}
      <Navbar
        gpsActive={gpsActive}
        simulating={isSimulating}
        activeTab={activeTab}
        onToggleSimulation={handleToggleSimulation}
        onSOS={handleSOSTrigger}
        onTabChange={setActiveTab}
        onDemo={handleDemoMode}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast((value) => !value)}
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
              <form onSubmit={handlePlanRoute} className="space-y-2">
                <label className="relative block">
                  <span className="sr-only">Starting point</span>
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-emerald-600" />
                  <input
                    value={originInput}
                    onChange={(event) => setOriginInput(event.target.value)}
                    placeholder="Starting point or lat, lng"
                    className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-9 py-2 text-sm text-slate-heading outline-none focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <label className="relative block">
                  <span className="sr-only">Destination</span>
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-brand-crimson" />
                  <input
                    value={destinationInput}
                    onChange={(event) => setDestinationInput(event.target.value)}
                    placeholder="Destination or lat, lng"
                    className="w-full rounded-md border border-red-200 bg-red-50 px-9 py-2 text-sm text-slate-heading outline-none focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isPlanningRoute}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-brand-teal px-3 py-2 text-sm font-semibold text-white hover:bg-brand-emerald disabled:cursor-wait disabled:opacity-60"
                >
                  {isPlanningRoute ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {isPlanningRoute ? 'Finding route...' : 'Plan safe route'}
                </button>
              </form>
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
              <form onSubmit={handlePlanRoute} className="space-y-2">
                <label className="relative block">
                  <span className="sr-only">Starting point</span>
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-emerald-600" />
                  <input
                    aria-label="Starting point"
                    value={originInput}
                    onChange={(event) => setOriginInput(event.target.value)}
                    placeholder="Starting point or lat, lng"
                    className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-9 py-2 text-sm text-slate-heading outline-none focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <label className="relative block">
                  <span className="sr-only">Destination</span>
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-brand-crimson" />
                  <input
                    aria-label="Destination"
                    value={destinationInput}
                    onChange={(event) => setDestinationInput(event.target.value)}
                    placeholder="Destination or lat, lng"
                    className="w-full rounded-md border border-red-200 bg-red-50 px-9 py-2 text-sm text-slate-heading outline-none focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isPlanningRoute}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-brand-teal px-3 py-2 text-sm font-semibold text-white hover:bg-brand-emerald disabled:cursor-wait disabled:opacity-60"
                >
                  {isPlanningRoute ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {isPlanningRoute ? 'Finding route...' : 'Plan safe route'}
                </button>
              </form>
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
          <SafetyDashboard hazards={allHazards} selectedRoute={selectedRoute} onShowOnMap={handleShowHazardOnMap} />
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

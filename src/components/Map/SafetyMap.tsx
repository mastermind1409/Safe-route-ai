import { MapContainer, TileLayer } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import type { Coordinates, Route, Hazard, SafeHub } from '../../types';
import { defaultCenter, defaultZoom } from '../../data/mockRoutes';
import MapClickHandler from './MapClickHandler';
import MapController from './MapController';
import RouteLayers from './RouteLayers';
import MarkerLayers from './MarkerLayers';
import UserMarker from './UserMarker';
import MapControls from './MapControls';
import { distanceToPolyline } from '../../utils/haversine';

interface SafetyMapProps {
    mapRef: React.MutableRefObject<LeafletMap | null>;
    routes: Route[];
    selectedRouteId: string;
    userPosition: Coordinates | null;
    simPosition: Coordinates | null;
    isSimulating: boolean;
    extraHazards: Hazard[];
    flyToCenter: Coordinates | null;
    onMapClick: (position: Coordinates) => void;
    onSelectRoute: (id: string) => void;
}

export default function SafetyMap({
    mapRef,
    routes,
    selectedRouteId,
    userPosition,
    simPosition,
    isSimulating,
    extraHazards,
    flyToCenter,
    onMapClick,
    onSelectRoute,
}: SafetyMapProps) {
    const selectedRoute = routes.find((route) => route.id === selectedRouteId);
    const routeCoordinates = selectedRoute?.coordinates ?? [];
    const allHazards: Hazard[] = [
        ...(selectedRoute?.hazards ?? []),
        ...extraHazards.filter(
            (hazard) => distanceToPolyline(hazard.position, routeCoordinates) <= 180
        ),
    ];
    const allSafeHubs: SafeHub[] = selectedRoute?.safeHubs ?? [];

    return (
        <div className="flex-1 relative">
            <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[min(17rem,calc(100%-5rem))] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                    Demonstration map data
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
                    Sample corridors and hubs; reported hazards are community-submitted and unverified.
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-700">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Safer demo route</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600" /> Hazard report</span>
                </div>
            </div>
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                className="h-full w-full"
                zoomControl={false}
                ref={mapRef}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onClick={onMapClick} />
                {flyToCenter && <MapController center={flyToCenter} />}
                <RouteLayers
                    routes={routes}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={onSelectRoute}
                />
                <MarkerLayers
                    hazards={allHazards}
                    safeHubs={allSafeHubs}
                    simPosition={simPosition}
                    simulating={isSimulating}
                />
                {userPosition && <UserMarker position={userPosition} />}
            </MapContainer>
            <MapControls
                mapRef={mapRef}
                userPosition={userPosition}
            />
        </div>
    );
}

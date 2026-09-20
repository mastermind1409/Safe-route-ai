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
    // Collect all hazards and safe hubs from all routes + extras
    const allHazards: Hazard[] = [
        ...routes.flatMap((r) => r.hazards),
        ...extraHazards,
    ];
    const allSafeHubs: SafeHub[] = routes.flatMap((r) => r.safeHubs);

    return (
        <div className="flex-1 relative">
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                className="h-full w-full"
                zoomControl={false}
                ref={mapRef}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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

import { Polyline, Tooltip } from 'react-leaflet';
import type { Route } from '../../types';

interface RouteLayersProps {
    routes: Route[];
    selectedRouteId: string;
    onSelectRoute: (id: string) => void;
}

export default function RouteLayers({
    routes,
    selectedRouteId,
    onSelectRoute,
}: RouteLayersProps) {
    return (
        <>
            {routes.map((route) => {
                const isSelected = route.id === selectedRouteId;
                return (
                    <Polyline
                        key={route.id}
                        positions={route.coordinates}
                        pathOptions={{
                            color: route.color,
                            weight: isSelected ? 5 : 3,
                            opacity: isSelected ? 1 : 0.5,
                            dashArray: route.dashArray,
                        }}
                        eventHandlers={{
                            click: () => onSelectRoute(route.id),
                        }}
                    >
                        <Tooltip sticky>
                            <div className="text-xs">
                                <span className="font-semibold">{route.name}</span>
                                <span className="text-slate-muted ml-1">
                                    — Score: {route.safetyScore}/100
                                </span>
                            </div>
                        </Tooltip>
                    </Polyline>
                );
            })}
        </>
    );
}

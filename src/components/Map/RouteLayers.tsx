import { Fragment } from 'react';
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
                    <Fragment key={route.id}>
                        {isSelected && (
                            <Polyline
                                positions={route.coordinates}
                                pathOptions={{ color: '#FFFFFF', weight: 11, opacity: 0.95 }}
                                eventHandlers={{ click: () => onSelectRoute(route.id) }}
                            />
                        )}
                        <Polyline
                            positions={route.coordinates}
                            pathOptions={{
                                color: route.color,
                                weight: isSelected ? 7 : 4,
                                opacity: isSelected ? 1 : 0.65,
                                dashArray: isSelected ? undefined : route.dashArray,
                            }}
                            eventHandlers={{ click: () => onSelectRoute(route.id) }}
                        >
                            <Tooltip sticky>
                                <div className="text-sm">
                                    <span className="font-semibold">{route.name}</span>
                                    <span className="text-slate-muted ml-1">
                                        — Score: {route.safetyScore}/100
                                    </span>
                                </div>
                            </Tooltip>
                        </Polyline>
                    </Fragment>
                );
            })}
        </>
    );
}

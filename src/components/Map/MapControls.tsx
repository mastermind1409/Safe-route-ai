import { LocateFixed, Layers } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import type { Coordinates } from '../../types';
import { defaultCenter, defaultZoom } from '../../data/mockRoutes';

interface MapControlsProps {
    mapRef: React.MutableRefObject<LeafletMap | null>;
    userPosition: Coordinates | null;
}

export default function MapControls({
    mapRef,
    userPosition,
}: MapControlsProps) {
    const handleLocate = () => {
        const map = mapRef.current;
        if (!map) return;
        const target = userPosition ?? defaultCenter;
        map.flyTo(target, map.getZoom() < 14 ? 15 : map.getZoom(), {
            duration: 1.2,
        });
    };

    const handleReset = () => {
        const map = mapRef.current;
        if (!map) return;
        map.flyTo(defaultCenter, defaultZoom, { duration: 1 });
    };

    return (
        <div
            className="absolute top-3 right-3 z-[1000] pointer-events-auto relative flex flex-col gap-2"
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleLocate();
                }}
                className="w-9 h-9 bg-surface border border-border-light rounded-lg shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
                title="Locate Me"
            >
                <LocateFixed className="w-4 h-4 text-brand-teal" />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                }}
                className="w-9 h-9 bg-surface border border-border-light rounded-lg shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
                title="Reset View"
            >
                <Layers className="w-4 h-4 text-slate-muted" />
            </button>
        </div>
    );
}

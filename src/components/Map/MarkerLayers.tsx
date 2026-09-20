import { Marker, Popup } from 'react-leaflet';
import type { Hazard, SafeHub, Coordinates } from '../../types';
import { createHazardIcon, createSafeHubIcon, createSimWalkerIcon } from '../../utils/leafletIcons';

interface MarkerLayersProps {
    hazards: Hazard[];
    safeHubs: SafeHub[];
    simPosition: Coordinates | null;
    simulating: boolean;
}

const hazardLabels: Record<string, string> = {
    dark_stretch: 'Dark Stretch',
    broken_streetlight: 'Broken Streetlight',
    harassment_concern: 'Harassment Concern',
};

export default function MarkerLayers({
    hazards,
    safeHubs,
    simPosition,
    simulating,
}: MarkerLayersProps) {
    return (
        <>
            {/* Hazard markers */}
            {hazards.map((hazard) => (
                <Marker
                    key={hazard.id}
                    position={hazard.position}
                    icon={createHazardIcon(hazard.severity)}
                >
                    <Popup>
                        <div className="text-xs min-w-[160px]">
                            <div className="font-semibold text-red-700 mb-1">
                                ⚠ {hazardLabels[hazard.type] ?? hazard.type}
                            </div>
                            <p className="text-slate-600 mb-1">{hazard.label}</p>
                            <div className="flex justify-between text-slate-400">
                                <span>Severity: {hazard.severity}</span>
                                <span>▲ {hazard.upvotes}</span>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Safe hub markers */}
            {safeHubs.map((hub) => (
                <Marker
                    key={hub.id}
                    position={hub.position}
                    icon={createSafeHubIcon(hub.type)}
                >
                    <Popup>
                        <div className="text-xs min-w-[140px]">
                            <div className="font-semibold text-emerald-700 mb-1">
                                ✓ {hub.name}
                            </div>
                            <p className="text-slate-500">
                                {hub.open24x7 ? 'Open 24/7' : 'Limited hours'}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Sim walker avatar */}
            {simulating && simPosition && (
                <Marker
                    position={simPosition}
                    icon={createSimWalkerIcon()}
                >
                    <Popup>
                        <div className="text-xs font-medium text-cyan-700">
                            🚶 Simulated Walker
                        </div>
                    </Popup>
                </Marker>
            )}
        </>
    );
}

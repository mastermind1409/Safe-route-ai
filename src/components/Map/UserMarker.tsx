import { Marker, Popup } from 'react-leaflet';
import type { Coordinates } from '../../types';
import { createUserLocationIcon } from '../../utils/leafletIcons';

interface UserMarkerProps {
    position: Coordinates;
}

export default function UserMarker({ position }: UserMarkerProps) {
    return (
        <Marker position={position} icon={createUserLocationIcon()}>
            <Popup>
                <div className="text-xs font-medium text-blue-700">
                    📍 Your Location
                    <div className="text-slate-400 mt-0.5">
                        {position[0].toFixed(4)}, {position[1].toFixed(4)}
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}

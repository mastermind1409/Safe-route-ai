import { useMapEvents } from 'react-leaflet';
import type { Coordinates } from '../../types';

interface MapClickHandlerProps {
    onClick: (position: Coordinates) => void;
}

export default function MapClickHandler({ onClick }: MapClickHandlerProps) {
    useMapEvents({
        click(e) {
            onClick([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

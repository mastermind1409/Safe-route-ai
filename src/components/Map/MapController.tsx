import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
    center: [number, number];
    zoom?: number;
}

/**
 * Internal child component inside <MapContainer> that uses useMap()
 * to programmatically fly the camera to a given center/zoom.
 */
export default function MapController({ center, zoom }: MapControllerProps) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom ?? map.getZoom(), { duration: 1.2 });
        }
    }, [center, zoom, map]);

    return null;
}

import type { Coordinates } from '../types';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/**
 * Haversine formula — returns distance in meters between two [lat, lng] coordinates.
 *
 * d = 2R × arcsin(√(sin²(Δφ/2) + cos(φ₁)·cos(φ₂)·sin²(Δλ/2)))
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
    const [lat1, lng1] = a;
    const [lat2, lng2] = b;

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const sinHalfLat = Math.sin(dLat / 2);
    const sinHalfLng = Math.sin(dLng / 2);

    const h =
        sinHalfLat * sinHalfLat +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * sinHalfLng * sinHalfLng;

    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/**
 * Check if a coordinate is within a given radius (in meters) of any hazard positions.
 * Returns the IDs of hazards within range.
 */
export function findNearbyHazardIds(
    position: Coordinates,
    hazards: { id: string; position: Coordinates }[],
    radiusMeters: number = 120
): string[] {
    return hazards
        .filter((h) => haversineDistance(position, h.position) <= radiusMeters)
        .map((h) => h.id);
}

/**
 * Calculate the total polyline distance of a coordinate array in meters.
 */
export function polylineDistance(coords: Coordinates[]): number {
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
        total += haversineDistance(coords[i - 1], coords[i]);
    }
    return total;
}

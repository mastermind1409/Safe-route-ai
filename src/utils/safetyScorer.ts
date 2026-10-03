import type { Route, SafetyBreakdown } from '../types';

export function getTimeOfDayMultiplier(date: Date = new Date()): number {
    const hour = date.getHours();
    return hour >= 6 && hour < 18 ? 1 : 1.5;
}

/**
 * Safety Index Formula:
 * S = max(0, min(100, 100 - Σ(wᵢ·Hᵢ) + Σ(bⱼ·Aⱼ) + L))
 *
 * Hazard penalties (Hᵢ):
 *   - Streetlight outage: -8 pts
 *   - Deserted stretch:   -15 pts
 *   - Harassment report:  -25 pts
 *
 * Anchor bonuses (Aⱼ):
 *   - 24/7 pharmacy:       +6 pts
 *   - Transit police booth: +12 pts
 *   - Open commercial hub:  +8 pts
 *
 * Lighting factor (L): lightingRatio × 20
 */
export function calculateSafetyScore(route: Route, now: Date = new Date()): number {
    const timeOfDayMultiplier = getTimeOfDayMultiplier(now);
    const hazardPenalty = route.hazards.reduce((sum, h) => {
        const isLightingHazard = h.type === 'dark_stretch' || h.type === 'broken_streetlight';
        const penalty = isLightingHazard ? h.penalty * timeOfDayMultiplier : h.penalty;
        return sum + penalty;
    }, 0);
    const anchorBonus = route.safeHubs.reduce((sum, hub) => sum + hub.bonus, 0);
    const lightingFactor = route.lightingRatio * 20;

    return Math.max(0, Math.min(100, Math.round(100 - hazardPenalty + anchorBonus + lightingFactor)));
}

/**
 * Compute a breakdown for the safety audit visual meters.
 */
export function computeSafetyBreakdown(route: Route): SafetyBreakdown {
    // Lighting: direct ratio scaled to 100
    const lighting = Math.round(route.lightingRatio * 100);

    // Police Proximity: based on presence of police booths (0-100)
    const policeBooths = route.safeHubs.filter((h) => h.type === 'police_booth').length;
    const policeProximity = Math.min(100, policeBooths * 50);

    // Commercial Density: based on commercial / pharmacy hubs
    const commercialNodes = route.safeHubs.filter(
        (h) => h.type === 'commercial_hub' || h.type === 'pharmacy'
    ).length;
    const commercialDensity = Math.min(100, commercialNodes * 30);

    return {
        lighting,
        policeProximity,
        commercialDensity,
        overallScore: calculateSafetyScore(route),
    };
}

/**
 * Recalculate a route's safety score after adding a new hazard.
 */
export function recalculateRouteScore(route: Route): Route {
    return {
        ...route,
        safetyScore: route.safetyScoreAvailable === false
            ? route.safetyScore
            : calculateSafetyScore(route),
    };
}

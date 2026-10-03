import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb, ShieldCheck } from 'lucide-react';
import type { Coordinates, Hazard, Route } from '../../types';
import { distanceToPolyline, haversineDistance } from '../../utils/haversine';
import { getTimeOfDayMultiplier } from '../../utils/safetyScorer';

interface RouteInsightsProps {
    route: Route;
    hazards: Hazard[];
    userPosition: Coordinates | null;
}

export default function RouteInsights({ route, hazards, userPosition }: RouteInsightsProps) {
    const now = new Date();
    const isNight = getTimeOfDayMultiplier(now) > 1;
    const relevantHazards = useMemo(() => {
        const routeHazards = hazards.filter(
            (hazard) => distanceToPolyline(hazard.position, route.coordinates) <= 200
        );
        return Array.from(new Map(routeHazards.map((hazard) => [hazard.id, hazard])).values());
    }, [hazards, route.coordinates]);

    const nearbyHazard = userPosition
        ? relevantHazards
            .map((hazard) => ({ hazard, distance: haversineDistance(userPosition, hazard.position) }))
            .filter(({ distance }) => distance <= 500)
            .sort((a, b) => a.distance - b.distance)[0]
        : undefined;
    const lightingHazards = relevantHazards.filter(
        (hazard) => hazard.type === 'dark_stretch' || hazard.type === 'broken_streetlight'
    );

    return (
        <section className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-4" aria-label="Smart route insights">
            <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-950">
                    Smart Route Insights
                </h3>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                    {route.safetyScoreAvailable === false ? 'Preview only' : 'Demo signals'}
                </span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-slate-700">
                {route.safetyScoreAvailable === false
                    ? `${route.name} is a straight-line location preview, not a street-verified walking route. No safety score is available.`
                    : route.hazards.length === 0
                    ? `${route.name} has no mapped incidents along its corridor. This reflects available reports, not a guarantee of safety.`
                    : `${route.name} includes ${route.hazards.length} mapped ${route.hazards.length === 1 ? 'incident' : 'incidents'}; its current safety score is ${route.safetyScore}/100.`}
            </p>
            {route.safetyScoreAvailable !== false && (
            <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                    <span>
                        {route.safeHubs.length > 0
                            ? `${route.safeHubs.length} demo safe ${route.safeHubs.length === 1 ? 'hub is' : 'hubs are'} shown near this route.`
                            : 'No demo safe hubs are shown on this route.'}
                    </span>
                </li>
                <li className="flex items-start gap-2">
                    {isNight ? (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                    ) : (
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                    )}
                    <span>
                        {isNight
                            ? `${lightingHazards.length} mapped lighting ${lightingHazards.length === 1 ? 'issue is' : 'issues are'} weighted more heavily at night.`
                            : `Lighting coverage is estimated at ${Math.round(route.lightingRatio * 100)}% for this corridor.`}
                    </span>
                </li>
            </ul>
            )}
            {route.safetyScoreAvailable === false && (
                <p className="rounded-md border border-amber-300 bg-amber-100 px-3 py-2 text-xs leading-relaxed text-amber-950">
                    Do not use this preview for turn-by-turn navigation. Choose one of the demonstration corridors or use a dedicated pedestrian navigation service.
                </p>
            )}
            {route.safetyScoreAvailable !== false && (
                <details className="mt-3 border-t border-indigo-200 pt-3 text-xs text-slate-700">
                    <summary className="cursor-pointer font-semibold text-indigo-900">
                        Why this score?
                    </summary>
                    <p className="mt-2 leading-relaxed">
                        The demonstration estimate starts at 100, subtracts configured hazard penalties, adds mapped safe-hub bonuses, and adds a lighting estimate. Lighting-related penalties are weighted more at night. These are sample inputs and a simple rule—not an AI prediction or verified safety assessment.
                    </p>
                </details>
            )}
            {nearbyHazard && (
                <div className="mt-3 rounded-md border border-amber-300 bg-amber-100 px-3 py-2 text-xs text-amber-950" role="alert">
                    <strong>Nearby unverified report:</strong> {nearbyHazard.hazard.label} · about {Math.round(nearbyHazard.distance)} m away
                </div>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                {route.safetyScoreAvailable === false
                    ? 'This line is a straight-line geocoding preview and does not follow streets.'
                    : 'Rule-based demo score uses seeded hazards, hubs, and lighting estimates—not verified or live safety data.'}
                {' '}Conditions can change; use your judgment.
            </p>
        </section>
    );
}

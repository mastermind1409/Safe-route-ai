import type { Route, Hazard, SafeHub, Coordinates } from '../types';

// ──────────────────────────────────────────────────
// Chennai Urban Corridor — T. Nagar → Pondy Bazaar
// ──────────────────────────────────────────────────

const directPathCoords: Coordinates[] = [
    [13.0410, 80.2340],  // Start: T. Nagar Bus Terminus
    [13.0418, 80.2355],
    [13.0430, 80.2368],
    [13.0445, 80.2372],  // Dark stretch begins
    [13.0460, 80.2380],
    [13.0472, 80.2395],  // Narrow alley
    [13.0485, 80.2408],
    [13.0498, 80.2415],  // Broken streetlight
    [13.0510, 80.2425],
    [13.0522, 80.2438],
    [13.0535, 80.2448],
    [13.0548, 80.2460],  // Deserted stretch
    [13.0560, 80.2472],
    [13.0570, 80.2480],  // End: Pondy Bazaar Junction
];

const safeCorridorCoords: Coordinates[] = [
    [13.0410, 80.2340],  // Start: T. Nagar Bus Terminus
    [13.0415, 80.2330],
    [13.0425, 80.2318],
    [13.0438, 80.2310],  // South Usman Road (well-lit commercial)
    [13.0450, 80.2305],
    [13.0465, 80.2310],  // Near 24/7 Apollo Pharmacy
    [13.0478, 80.2320],
    [13.0490, 80.2335],  // Transit police booth
    [13.0502, 80.2350],
    [13.0515, 80.2365],
    [13.0528, 80.2380],  // Ranganathan Street commercial hub
    [13.0540, 80.2400],  // Near MedPlus Pharmacy (24/7)
    [13.0552, 80.2420],
    [13.0560, 80.2440],
    [13.0568, 80.2460],
    [13.0570, 80.2480],  // End: Pondy Bazaar Junction
];

// ──────────────────────────────────────────────────
// Hazards for Route A (Direct Path)
// ──────────────────────────────────────────────────
const directPathHazards: Hazard[] = [
    {
        id: 'h1',
        type: 'dark_stretch',
        label: 'Unlit back lane near GN Chetty Rd',
        position: [13.0445, 80.2372],
        severity: 'high',
        reportedAt: '2026-09-19T22:15:00',
        upvotes: 14,
        penalty: 15,
    },
    {
        id: 'h2',
        type: 'broken_streetlight',
        label: 'Broken streetlight at Habibullah Rd junction',
        position: [13.0498, 80.2415],
        severity: 'moderate',
        reportedAt: '2026-09-20T01:30:00',
        upvotes: 8,
        penalty: 8,
    },
    {
        id: 'h3',
        type: 'dark_stretch',
        label: 'Deserted service road near Nandanam',
        position: [13.0548, 80.2460],
        severity: 'high',
        reportedAt: '2026-09-19T23:45:00',
        upvotes: 21,
        penalty: 15,
    },
    {
        id: 'h4',
        type: 'harassment_concern',
        label: 'Reported harassment near narrow alley',
        position: [13.0472, 80.2395],
        severity: 'high',
        reportedAt: '2026-09-18T21:00:00',
        upvotes: 32,
        penalty: 25,
    },
];

// ──────────────────────────────────────────────────
// Safe Hubs for Route B (Safe Corridor)
// ──────────────────────────────────────────────────
const safeCorridorHubs: SafeHub[] = [
    {
        id: 's1',
        name: 'Apollo Pharmacy (24/7)',
        type: 'pharmacy',
        position: [13.0465, 80.2310],
        open24x7: true,
        bonus: 6,
    },
    {
        id: 's2',
        name: 'T. Nagar Transit Police Booth',
        type: 'police_booth',
        position: [13.0490, 80.2335],
        open24x7: true,
        bonus: 12,
    },
    {
        id: 's3',
        name: 'Ranganathan Street Commercial Hub',
        type: 'commercial_hub',
        position: [13.0528, 80.2380],
        open24x7: false,
        bonus: 8,
    },
    {
        id: 's4',
        name: 'MedPlus Pharmacy (24/7)',
        type: 'pharmacy',
        position: [13.0540, 80.2400],
        open24x7: true,
        bonus: 6,
    },
];

// Direct path has minimal safe hubs
const directPathHubs: SafeHub[] = [
    {
        id: 's5',
        name: 'Closed tea stall (limited hours)',
        type: 'commercial_hub',
        position: [13.0430, 80.2368],
        open24x7: false,
        bonus: 8,
    },
];

// Hazards occasionally near safe corridor (minor)
const safeCorridorHazards: Hazard[] = [
    {
        id: 'h5',
        type: 'broken_streetlight',
        label: 'Dim streetlight near Usman Rd bend',
        position: [13.0438, 80.2310],
        severity: 'low',
        reportedAt: '2026-09-20T06:00:00',
        upvotes: 3,
        penalty: 8,
    },
];

// ──────────────────────────────────────────────────
// Route Definitions
// ──────────────────────────────────────────────────
export const directRoute: Route = {
    id: 'route-a',
    name: 'Direct Path',
    tag: 'Fastest',
    distance: 950,
    walkTime: 12,
    coordinates: directPathCoords,
    safetyScore: 54,
    hazards: directPathHazards,
    safeHubs: directPathHubs,
    lightingRatio: 0.35,
    color: '#DC2626',
    dashArray: '10, 8',
    recommended: false,
};

export const safeRoute: Route = {
    id: 'route-b',
    name: 'Safe Corridor',
    tag: 'Recommended',
    distance: 1250,
    walkTime: 16,
    coordinates: safeCorridorCoords,
    safetyScore: 93,
    hazards: safeCorridorHazards,
    safeHubs: safeCorridorHubs,
    lightingRatio: 0.88,
    color: '#059669',
    recommended: true,
};

export const allRoutes: Route[] = [directRoute, safeRoute];

export const defaultCenter: Coordinates = [13.0490, 80.2380];
export const defaultZoom = 14;

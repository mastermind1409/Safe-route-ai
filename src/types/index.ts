export type Coordinates = [number, number]; // [lat, lng]

export type HazardType = 'dark_stretch' | 'broken_streetlight' | 'harassment_concern';
export type Severity = 'low' | 'moderate' | 'high';

export interface Hazard {
    id: string;
    type: HazardType;
    label: string;
    position: Coordinates;
    severity: Severity;
    reportedAt: string;
    upvotes: number;
    penalty: number;
}

export interface SafeHub {
    id: string;
    name: string;
    type: 'pharmacy' | 'police_booth' | 'commercial_hub';
    position: Coordinates;
    open24x7: boolean;
    bonus: number;
}

export interface Route {
    id: string;
    name: string;
    tag: string;
    distance: number;      // meters
    walkTime: number;       // minutes
    coordinates: Coordinates[];
    safetyScore: number;
    hazards: Hazard[];
    safeHubs: SafeHub[];
    lightingRatio: number;  // 0-1 fraction of illuminated segments
    color: string;
    dashArray?: string;
    recommended: boolean;
}

export interface EmergencyState {
    active: boolean;
    countdown: number;
    lastKnownPosition: Coordinates | null;
    triggeredAt: string | null;
}

export interface HazardReport {
    type: HazardType;
    severity: Severity;
    position: Coordinates | null;
}

export interface ToastMessage {
    id: string;
    message: string;
    type: 'warning' | 'info' | 'success';
    timestamp: number;
}

export interface SafetyBreakdown {
    lighting: number;
    policeProximity: number;
    commercialDensity: number;
    overallScore: number;
}

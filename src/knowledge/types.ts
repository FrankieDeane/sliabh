export interface PackMeta {
  id: string;
  name: string;
  country: string;
  region: string;
  version: string;
  schema_version: number;
  updated_at: string;
  bbox: { sw: [number, number]; ne: [number, number] };
}

export interface Route {
  id: string;
  name: string;
  type: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert';
  distance_km: number;
  duration_days: { min: number; max: number };
  elevation_gain_m: number;
  segments: string[];
  warnings: string[];
  permits_required: boolean;
}

export interface Refuge {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation_m: number;
  capacity: number;
  services: string[];
  season: { open: string; close: string };
  booking_required: boolean;
  emergency_contact?: string;
}

export interface Campground {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation_m: number;
  capacity: number;
  services: string[];
  water_available: boolean;
  fee_usd: number;
}

export interface WaterPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'river' | 'lake' | 'spring' | 'tap';
  treatment_required: boolean;
  reliable_year_round: boolean;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  area: string;
  message: string;
  permanent: boolean;
}

export interface GearRecommendation {
  context: string;
  essential: string[];
  recommended: string[];
  weight_target_kg: number;
}

export interface FAQ {
  q: string;
  a: string;
  tags: string[];
}

export interface KnowledgePack {
  meta: PackMeta;
  routes: Route[];
  refuges: Refuge[];
  campgrounds: Campground[];
  waterPoints: WaterPoint[];
  alerts: Alert[];
  gear: GearRecommendation[];
  faqs: FAQ[];
}

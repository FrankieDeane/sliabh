import { ARGENTINA_TRAILS } from '../data/argentinaTrails';
import { BARILOCHE_TRAILS } from '../data/barilocheTreks';
import {
  buildTrailGraph, placesOnGraph, suggestRoute as suggestOnGraph,
  type TrailGraph, type Place, type LatLon, type RouteOptions, type RouteResult,
} from './trailRouter';

export type { Place, RouteResult, RouteOptions, RouteDifficulty, RouteLeg } from './trailRouter';
export { normalizeForSearch } from './trailRouter';

let graph: TrailGraph | null = null;
let places: Place[] | null = null;

/** Built on first use and kept: a few hundred points, a few milliseconds. */
function trailGraph(): TrailGraph {
  if (!graph) graph = buildTrailGraph([...ARGENTINA_TRAILS, ...BARILOCHE_TRAILS]);
  return graph;
}

export function routablePlaces(): Place[] {
  if (!places) places = placesOnGraph(trailGraph());
  return places;
}

export function suggestRoute(from: LatLon, to: LatLon, opts?: RouteOptions): RouteResult {
  return suggestOnGraph(trailGraph(), from, to, opts);
}

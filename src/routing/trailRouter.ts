/**
 * Suggests a way between two points over the trails the app already carries.
 *
 * Runs entirely on the phone, with no signal and no server: the trail lines
 * bundled with the app (curated tracks plus the ones imported from
 * OpenStreetMap) are joined into one network wherever two trails meet, and the
 * quickest way across it is found with A*. The same TypeScript runs on Android,
 * iOS and the web, so all three suggest exactly the same route.
 *
 * Why not GraphHopper or BRouter: both are Java. Neither runs on iOS nor in a
 * browser, so using one would mean a different engine — and different routes —
 * per platform. This is the same idea (a graph and a hiking cost profile) kept
 * small enough to ship inside the app.
 *
 * Cost profile, per stretch of trail:
 *   - walking time from Tobler's hiking function, using the climb or descent
 *     when both ends carry an altitude, flat ground otherwise;
 *   - multiplied by a factor for the trail's difficulty, so an easy trail wins
 *     a close call against a hard one;
 *   - trails above the walker's chosen difficulty are left out altogether.
 *
 * Kept free of app imports on purpose, so the validation script can run it
 * directly under Node.
 */

export type RouteDifficulty = 'facil' | 'moderado' | 'dificil' | 'extremo';

export interface RoutableTrail {
  id: string;
  name: string;
  difficulty: RouteDifficulty;
  distance_km: number;
  source?: string;
  trailhead?: string;
  /** true = out-and-back, so `distance_km` counts the walk there and back. */
  round_trip?: boolean;
  gpxTrack?: Array<{ lat: number; lon: number; ele?: number; name?: string }>;
  namedWaypoints?: Array<{ lat: number; lon: number; name: string }>;
}

export interface LatLon { lat: number; lon: number }

export interface GraphNode extends LatLon {
  ele?: number;
  /** Names given to this spot by any trail passing through it. */
  names: string[];
}

export interface GraphEdge {
  to: number;
  km: number;
  /** Signed metres from this end to the other; undefined when unknown. */
  dEle?: number;
  trailId: string;
  difficulty: RouteDifficulty;
  /** From OpenStreetMap: shown as unverified, and needs the © OpenStreetMap credit. */
  osm: boolean;
  /** A short join between the end of one trail and another, with no recorded line. */
  link?: boolean;
}

export interface TrailGraph {
  nodes: GraphNode[];
  adj: GraphEdge[][];
  trails: Map<string, RoutableTrail>;
  /** Stretches dropped because they jump further than the whole trail is long. */
  droppedJumps: Array<{ trailId: string; km: number }>;
}

/** Points of different trails closer than this are the same junction. */
export const JUNCTION_M = 75;
/** How far off the network a start or destination may be and still be joined to it. */
export const MAX_SNAP_KM = 2;
/**
 * The end of a trail closer than this to another trail is joined to it. The
 * bundled lines are sparse — a point every few hundred metres — so two trails
 * that meet at a refugio often stop 100–400 m apart in the data (Frey, Jakob,
 * Colonia Suiza). Only trail ends are joined: that is where trails meet.
 */
export const LINK_M = 400;
/** A join has no recorded line, so it costs more than the same distance on trail. */
const LINK_FACTOR = 1.3;
export const LINK_TRAIL_ID = '__link';

const DIFF_RANK: Record<RouteDifficulty, number> = { facil: 0, moderado: 1, dificil: 2, extremo: 3 };
const DIFF_FACTOR: Record<RouteDifficulty, number> = { facil: 1, moderado: 1.1, dificil: 1.25, extremo: 1.5 };
/** Tobler's top speed (km/h), reached on a gentle 5 % descent. Keeps A* admissible. */
const TOBLER_MAX_KMH = 6;

const R_KM = 6371.0088;
export function haversineKm(a: LatLon, b: LatLon): number {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Tobler's hiking function: km/h for a slope given as rise over run. */
export function toblerKmh(slope: number): number {
  return 6 * Math.exp(-3.5 * Math.abs(slope + 0.05));
}

/**
 * Walking time as trail signposts state it (DIN 33466, the norm behind Alpine
 * and Swiss signs): 4 km/h on the flat, 300 m/h up, 500 m/h down; the larger
 * of the two plus half the smaller. Tobler picks the way, but it assumes a
 * fit walker with no pack and comes out an hour short on Laguna de los Tres,
 * so the time shown to the walker is this one.
 */
export function signpostHours(km: number, ascentM: number, descentM: number): number {
  const flat = km / 4;
  const vertical = ascentM / 300 + descentM / 500;
  return Math.max(flat, vertical) + Math.min(flat, vertical) / 2;
}

/** Hours to walk one stretch, before the difficulty factor. */
export function walkHours(km: number, dEle?: number): number {
  if (km <= 0) return 0;
  const slope = dEle === undefined ? 0 : dEle / (km * 1000);
  return km / toblerKmh(slope);
}

/**
 * How much longer the real trail is than its recorded line.
 *
 * The bundled lines are a point every few hundred metres joined by straight
 * lines, which cuts every bend: measured raw, the Laguna de los Tres comes out
 * at half its real length and the Cerro López at a sixth. The trail's own
 * published distance is the better figure, so each stretch is stretched by
 * the ratio between the two. An out-and-back trail's distance counts both
 * ways while its line is drawn once; one that does not say which is taken as
 * out-and-back when its published distance is nearly double its line or more.
 */
export function lengthFactor(trail: RoutableTrail, lineKm: number, loop: boolean): number {
  if (!(lineKm > 0) || !(trail.distance_km > 0)) return 1;
  const raw = trail.distance_km / lineKm;
  const outAndBack = trail.round_trip ?? (!loop && raw >= 1.8);
  const f = outAndBack ? raw / 2 : raw;
  return Math.min(4, Math.max(1, f));
}

export function isOsmSource(source?: string): boolean {
  return !!source && /openstreetmap/i.test(source);
}

/**
 * Joins every trail line into one network. Points closer than JUNCTION_M are
 * merged into a single node, which is how two trails that meet become
 * connected. A stretch longer than the whole trail claims to be is a data
 * error (a point pasted from somewhere else), not a path, and is left out.
 */
export function buildTrailGraph(trails: RoutableTrail[]): TrailGraph {
  const nodes: GraphNode[] = [];
  const adj: GraphEdge[][] = [];
  const byId = new Map<string, RoutableTrail>();
  const droppedJumps: TrailGraph['droppedJumps'] = [];

  // Spatial hash: cells of ~JUNCTION_M so a merge only checks nine cells.
  const cellDeg = JUNCTION_M / 111_000;
  const grid = new Map<string, number[]>();
  const cellOf = (p: LatLon) => [Math.floor(p.lat / cellDeg), Math.floor(p.lon / cellDeg)];

  function nodeFor(p: { lat: number; lon: number; ele?: number; name?: string }): number {
    const [cy, cx] = cellOf(p);
    let best = -1;
    let bestKm = JUNCTION_M / 1000;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (const i of grid.get(`${cy + dy}:${cx + dx}`) ?? []) {
          const d = haversineKm(nodes[i], p);
          if (d <= bestKm) { bestKm = d; best = i; }
        }
      }
    }
    if (best === -1) {
      best = nodes.length;
      nodes.push({ lat: p.lat, lon: p.lon, ele: p.ele, names: [] });
      adj.push([]);
      const key = `${cy}:${cx}`;
      const cell = grid.get(key);
      if (cell) cell.push(best); else grid.set(key, [best]);
    } else if (nodes[best].ele === undefined && p.ele !== undefined) {
      nodes[best].ele = p.ele;
    }
    if (p.name && !nodes[best].names.includes(p.name)) nodes[best].names.push(p.name);
    return best;
  }

  const ends: Array<{ node: number; trail: RoutableTrail }> = [];

  for (const trail of trails) {
    const pts = (trail.gpxTrack ?? []).filter(
      (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon),
    );
    if (pts.length < 2) continue;
    byId.set(trail.id, trail);
    const osm = isOsmSource(trail.source);
    // No single stretch can be longer than the whole trail.
    const maxStretchKm = Math.max(trail.distance_km || 0, 1);

    let lineKm = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = haversineKm(pts[i - 1], pts[i]);
      if (d <= maxStretchKm) lineKm += d;
    }
    const factor = lengthFactor(trail, lineKm, haversineKm(pts[0], pts[pts.length - 1]) < 0.3);

    const first = nodeFor(pts[0]);
    let prev = first;
    let prevPt = pts[0];
    for (let i = 1; i < pts.length; i++) {
      const pt = pts[i];
      const cur = nodeFor(pt);
      const lineStretch = haversineKm(prevPt, pt);
      const km = lineStretch * factor;
      if (lineStretch > maxStretchKm) {
        droppedJumps.push({ trailId: trail.id, km: Math.round(lineStretch * 10) / 10 });
      } else if (cur !== prev) {
        const a = nodes[prev];
        const b = nodes[cur];
        const dEle = a.ele !== undefined && b.ele !== undefined ? b.ele - a.ele : undefined;
        const base = { km, trailId: trail.id, difficulty: trail.difficulty, osm };
        adj[prev].push({ ...base, to: cur, dEle });
        adj[cur].push({ ...base, to: prev, dEle: dEle === undefined ? undefined : -dEle });
      }
      prev = cur;
      prevPt = pt;
    }
    ends.push({ node: first, trail }, { node: prev, trail });

    // Named landmarks lying on the line (within a junction) name that node.
    for (const wp of trail.namedWaypoints ?? []) {
      const near = nearestNode({ nodes, adj, trails: byId, droppedJumps }, wp, JUNCTION_M / 1000);
      if (near && !nodes[near.index].names.includes(wp.name)) nodes[near.index].names.push(wp.name);
    }
  }

  // Join each trail end to the nearest point of a different trail, unless a
  // different trail already passes through that end.
  const trailsAt = (i: number) => new Set(adj[i].filter((e) => !e.link).map((e) => e.trailId));
  for (const { node, trail } of ends) {
    if (adj[node].length === 0) continue;
    const here = trailsAt(node);
    if ([...here].some((id) => id !== trail.id)) continue;
    let best = -1;
    let bestKm = LINK_M / 1000;
    for (let j = 0; j < nodes.length; j++) {
      if (j === node || adj[j].length === 0) continue;
      if (Math.abs(nodes[j].lat - nodes[node].lat) > 0.005) continue;
      const others = trailsAt(j);
      if (others.size === 0 || (others.size === 1 && others.has(trail.id))) continue;
      const d = haversineKm(nodes[node], nodes[j]);
      if (d < bestKm) { bestKm = d; best = j; }
    }
    if (best === -1 || adj[node].some((e) => e.to === best)) continue;
    const other = adj[best].find((e) => !e.link && e.trailId !== trail.id)!;
    const difficulty = DIFF_RANK[other.difficulty] > DIFF_RANK[trail.difficulty] ? other.difficulty : trail.difficulty;
    const a = nodes[node];
    const b = nodes[best];
    const dEle = a.ele !== undefined && b.ele !== undefined ? b.ele - a.ele : undefined;
    const base = { km: bestKm, trailId: LINK_TRAIL_ID, difficulty, osm: false, link: true };
    adj[node].push({ ...base, to: best, dEle });
    adj[best].push({ ...base, to: node, dEle: dEle === undefined ? undefined : -dEle });
  }

  return { nodes, adj, trails: byId, droppedJumps };
}

/** Closest node that has at least one trail leaving it. */
export function nearestNode(
  g: Pick<TrailGraph, 'nodes' | 'adj'> & Partial<TrailGraph>,
  p: LatLon,
  maxKm = MAX_SNAP_KM,
): { index: number; km: number } | null {
  let best: { index: number; km: number } | null = null;
  for (let i = 0; i < g.nodes.length; i++) {
    if (g.adj[i].length === 0) continue;
    // Cheap reject before the trigonometry: 0.02° is at least ~1.4 km here.
    if (Math.abs(g.nodes[i].lat - p.lat) > maxKm / 100 + 0.02) continue;
    const km = haversineKm(g.nodes[i], p);
    if (km <= maxKm && (!best || km < best.km)) best = { index: i, km };
  }
  return best;
}

export interface RouteLeg {
  trailId: string;
  trailName: string;
  km: number;
  /** Name of the spot where this leg ends, when the data names it. */
  toName?: string;
  osm: boolean;
  /** A join between two trails with no recorded line: follow the signs. */
  link: boolean;
}

export type RouteResult =
  | {
      ok: true;
      points: Array<LatLon & { ele?: number }>;
      km: number;
      ascentM: number;
      descentM: number;
      /** Moving time in hours, signpost norm (DIN 33466), without stops. */
      hours: number;
      legs: RouteLeg[];
      /** Metres walked off-trail to reach the network at each end. */
      offTrailStartM: number;
      offTrailEndM: number;
      /** Any part of the route comes from OpenStreetMap. */
      usesOsm: boolean;
      /** Whether every stretch carried altitude, i.e. the climb is complete. */
      elevationComplete: boolean;
    }
  | { ok: false; reason: 'start-far' | 'end-far' | 'no-connection' | 'same-place' };

export interface RouteOptions {
  /** Hardest trail difficulty the walker accepts. Defaults to every trail. */
  maxDifficulty?: RouteDifficulty;
}

/** Minimal binary heap keyed by f-score. */
class Heap {
  private items: Array<[number, number]> = [];
  get size() { return this.items.length; }
  push(node: number, f: number) {
    const a = this.items;
    a.push([f, node]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): number {
    const a = this.items;
    const top = a[0][1];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

export function suggestRoute(
  g: TrailGraph,
  from: LatLon,
  to: LatLon,
  opts: RouteOptions = {},
): RouteResult {
  const start = nearestNode(g, from);
  if (!start) return { ok: false, reason: 'start-far' };
  const goal = nearestNode(g, to);
  if (!goal) return { ok: false, reason: 'end-far' };
  if (start.index === goal.index) return { ok: false, reason: 'same-place' };

  const maxRank = DIFF_RANK[opts.maxDifficulty ?? 'extremo'];
  const goalNode = g.nodes[goal.index];
  const h = (i: number) => haversineKm(g.nodes[i], goalNode) / TOBLER_MAX_KMH;

  const n = g.nodes.length;
  const cost = new Float64Array(n).fill(Infinity);
  const via = new Array<GraphEdge | null>(n).fill(null);
  const from_ = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const open = new Heap();
  cost[start.index] = 0;
  open.push(start.index, h(start.index));

  while (open.size) {
    const u = open.pop();
    if (closed[u]) continue;
    if (u === goal.index) break;
    closed[u] = 1;
    for (const e of g.adj[u]) {
      if (DIFF_RANK[e.difficulty] > maxRank || closed[e.to]) continue;
      const c = cost[u] + walkHours(e.km, e.dEle) * DIFF_FACTOR[e.difficulty] * (e.link ? LINK_FACTOR : 1);
      if (c < cost[e.to]) {
        cost[e.to] = c;
        via[e.to] = e;
        from_[e.to] = u;
        open.push(e.to, c + h(e.to));
      }
    }
  }
  if (!Number.isFinite(cost[goal.index])) return { ok: false, reason: 'no-connection' };

  // Walk back from the goal to recover the edges in order.
  const edges: GraphEdge[] = [];
  const order: number[] = [goal.index];
  for (let v = goal.index; v !== start.index; v = from_[v]) {
    edges.push(via[v]!);
    order.push(from_[v]);
  }
  edges.reverse();
  order.reverse();

  let km = 0, ascentM = 0, descentM = 0;
  let elevationComplete = true;
  let usesOsm = false;
  const legs: RouteLeg[] = [];
  edges.forEach((e, i) => {
    km += e.km;
    if (e.dEle === undefined) elevationComplete = false;
    else if (e.dEle > 0) ascentM += e.dEle;
    else descentM -= e.dEle;
    if (e.osm) usesOsm = true;
    const endNode = g.nodes[order[i + 1]];
    const last = legs[legs.length - 1];
    if (last && last.trailId === e.trailId) {
      last.km += e.km;
      last.toName = endNode.names[0] ?? last.toName;
    } else {
      legs.push({
        trailId: e.trailId,
        trailName: e.link ? '' : g.trails.get(e.trailId)?.name ?? e.trailId,
        km: e.km,
        toName: endNode.names[0],
        osm: e.osm,
        link: !!e.link,
      });
    }
  });

  // The walk to and from the network counts as flat.
  km += start.km + goal.km;
  const hours = signpostHours(km, ascentM, descentM);

  const points: Array<LatLon & { ele?: number }> = [];
  if (start.km > 0.01) points.push({ lat: from.lat, lon: from.lon });
  for (const i of order) points.push({ lat: g.nodes[i].lat, lon: g.nodes[i].lon, ele: g.nodes[i].ele });
  if (goal.km > 0.01) points.push({ lat: to.lat, lon: to.lon });

  return {
    ok: true,
    points,
    km,
    ascentM: Math.round(ascentM),
    descentM: Math.round(descentM),
    hours,
    legs,
    offTrailStartM: Math.round(start.km * 1000),
    offTrailEndM: Math.round(goal.km * 1000),
    usesOsm,
    elevationComplete,
  };
}

export interface Place extends LatLon {
  name: string;
  /** Trail the place belongs to, for the second line in a list. */
  trailName: string;
}

/**
 * Every named spot on the network — trailheads, refugios, lagunas,
 * miradores — once each, for picking where to go.
 */
export function placesOnGraph(g: TrailGraph): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  g.nodes.forEach((node, i) => {
    if (g.adj[i].length === 0) return;
    const onTrail = g.adj[i].find((e) => !e.link);
    const trailName = onTrail ? g.trails.get(onTrail.trailId)?.name ?? '' : '';
    for (const name of node.names) {
      const key = name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ name, lat: node.lat, lon: node.lon, trailName });
    }
  });
  // Each trail's own start, named after the trail, so a trail with an unnamed
  // first point can still be picked.
  for (const trail of g.trails.values()) {
    const p = trail.gpxTrack?.[0];
    if (!p) continue;
    const name = `${trail.name} (inicio)`;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, lat: p.lat, lon: p.lon, trailName: trail.name });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** Accent- and case-insensitive match, so "jakob" finds "Refugio Jakob" and "lagüna" still matches. */
export function normalizeForSearch(s: string): string {
  let out = s.toLowerCase();
  try {
    out = out.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    // An engine without Unicode normalization: the Spanish accents by hand, below.
  }
  return out.replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n');
}

/**
 * Servidor MCP público de Sliabh: senderos de los parques nacionales de
 * Argentina para Claude (y cualquier cliente MCP).
 *
 * - Transporte Streamable HTTP sin estado (sin sesiones), respuestas JSON:
 *   cada request crea su propio servidor, lo que encaja con una función
 *   serverless (netlify/functions/mcp.mts, publicada en /mcp).
 * - Sin autenticación: son datos públicos, los mismos de sliabh.com.ar.
 * - Todas las herramientas son de solo lectura (readOnlyHint) y tienen título,
 *   como pide el directorio de conectores de Claude.
 * - No guarda nada de lo que se consulta.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import {
  listParks, findPark, parkDetail, searchTrails, findTrail, trailDetail, trailsNear,
  DIFFICULTIES, ACTIVITIES, type Lang, type DifficultyKey, type ActivityKey,
} from './catalog';
import { NATIONAL_PARKS, type ParkRegion } from './parks';

export const SERVER_NAME = 'sliabh-argentina-trails';
export const SERVER_VERSION = '1.1.0';

/** Lo que muestran los clientes MCP junto al nombre del conector. */
export const SERVER_DESCRIPTION =
  'Hiking trails of Argentina\'s 39 national parks — Patagonia, El Chaltén, Bariloche, Tierra del Fuego and more: ' +
  'distance, elevation, duration, difficulty, season, permits and trailheads, in English or Spanish. ' +
  '/ Rutas de trekking de los 39 parques nacionales de Argentina, en español o inglés.';

/** Escudo de Sliabh (public/mcp-icon-*.png), para el ícono del conector. */
export const SERVER_ICONS = [
  { src: 'https://sliabh.com.ar/mcp-icon-512.png', mimeType: 'image/png', sizes: ['512x512'] },
  { src: 'https://sliabh.com.ar/mcp-icon-128.png', mimeType: 'image/png', sizes: ['128x128'] },
];

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

const langSchema = z
  .enum(['es', 'en'])
  .default('es')
  .describe('Language for names, labels and descriptions: "es" (Spanish) or "en" (English).');

const difficultyKeys = Object.keys(DIFFICULTIES) as [DifficultyKey, ...DifficultyKey[]];
const activityKeys = Object.keys(ACTIVITIES) as [ActivityKey, ...ActivityKey[]];
const regionKeys: [ParkRegion, ...ParkRegion[]] = ['noroeste', 'noreste', 'centro', 'patagonia-norte', 'patagonia-austral'];

function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string) {
  return { isError: true, content: [{ type: 'text' as const, text: message }] };
}

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: SERVER_NAME,
      title: 'Sliabh — Argentina National Parks Trails',
      version: SERVER_VERSION,
      description: SERVER_DESCRIPTION,
      websiteUrl: 'https://sliabh.com.ar/claude/',
      icons: SERVER_ICONS,
    },
    {
      instructions:
        'Hiking trail data for Argentina\'s 39 national parks and other mountain areas, from Sliabh (sliabh.com.ar). ' +
        'Data covers distance, elevation gain, duration, difficulty, season, permits and trailheads. ' +
        'Not every national park has mapped trails yet: list_national_parks shows trail_count for each park.',
    },
  );

  server.registerTool(
    'list_national_parks',
    {
      title: 'List national parks',
      description:
        'Lists Argentina\'s 39 national parks with their provinces, region and how many hiking trails Sliabh has mapped in each. ' +
        'Optionally filter by region, province, or only parks that have trails.',
      inputSchema: {
        region: z.enum(regionKeys).optional().describe('APN region: noroeste, noreste, centro, patagonia-norte or patagonia-austral.'),
        province: z.string().min(2).max(40).optional().describe('Province name, e.g. "Neuquén" or "Santa Cruz" (accents optional).'),
        only_with_trails: z.boolean().default(false).describe('If true, return only parks with at least one mapped trail.'),
        lang: langSchema,
      },
      annotations: { title: 'List national parks', ...READ_ONLY },
    },
    async ({ region, province, only_with_trails, lang }) =>
      ok(listParks({ region, province, onlyWithTrails: only_with_trails }, lang as Lang)),
  );

  server.registerTool(
    'get_national_park',
    {
      title: 'Get a national park and its trails',
      description:
        'Returns one national park (by slug or name, e.g. "nahuel-huapi" or "Lanín") with its provinces, region and every trail Sliabh has mapped in it.',
      inputSchema: {
        park: z.string().min(2).max(80).describe('Park slug from list_national_parks, or the park name.'),
        lang: langSchema,
      },
      annotations: { title: 'Get a national park and its trails', ...READ_ONLY },
    },
    async ({ park, lang }) => {
      const found = findPark(park);
      if (!found.park) {
        return fail(
          `No national park matches "${park}".` +
            (found.suggestions.length ? ` Did you mean: ${found.suggestions.join(', ')}?` : '') +
            ` Valid slugs: ${NATIONAL_PARKS.map((p) => p.slug).join(', ')}.`,
        );
      }
      return ok(parkDetail(found.park, lang as Lang));
    },
  );

  server.registerTool(
    'search_trails',
    {
      title: 'Search hiking trails',
      description:
        'Searches hiking trails in Argentina by keyword and filters: national park, province, difficulty, activity, ' +
        'maximum distance, duration or elevation gain. Returns a short summary per trail; use get_trail for full details.',
      inputSchema: {
        query: z.string().max(100).optional().describe('Keywords matched against trail name, area, trailhead and description, e.g. "Fitz Roy" or "laguna".'),
        park: z.string().max(80).optional().describe('National park slug or name to search within.'),
        province: z.string().max(40).optional().describe('Province name, e.g. "Río Negro".'),
        difficulty: z.array(z.enum(difficultyKeys)).max(4).optional().describe('One or more of: easy, moderate, hard, extreme.'),
        activity: z.array(z.enum(activityKeys)).max(4).optional().describe('One or more of: trekking, climbing, traverse, high_mountain.'),
        max_distance_km: z.number().positive().max(500).optional().describe('Maximum trail length in km.'),
        max_duration_hours: z.number().positive().max(720).optional().describe('Maximum duration in hours (multi-day treks count 24 h per day).'),
        max_elevation_gain_m: z.number().positive().max(10000).optional().describe('Maximum elevation gain in meters.'),
        national_parks_only: z.boolean().default(false).describe('If true, only trails inside a national park.'),
        sort: z.enum(['relevance', 'distance_asc', 'distance_desc', 'elevation_asc', 'elevation_desc']).default('relevance').describe('Result order.'),
        limit: z.number().int().min(1).max(25).default(10).describe('Maximum number of trails to return (1–25).'),
        lang: langSchema,
      },
      annotations: { title: 'Search hiking trails', ...READ_ONLY },
    },
    async (a) => {
      const res = searchTrails(
        {
          query: a.query, park: a.park, province: a.province, difficulty: a.difficulty, activity: a.activity,
          maxDistanceKm: a.max_distance_km, maxDurationHours: a.max_duration_hours, maxElevationGainM: a.max_elevation_gain_m,
          nationalParksOnly: a.national_parks_only, sort: a.sort, limit: a.limit,
        },
        a.lang as Lang,
      );
      if ('error' in res) {
        const suggestions = res.suggestions ?? [];
        return fail(
          `No national park matches "${a.park}".` +
            (suggestions.length ? ` Did you mean: ${suggestions.join(', ')}?` : '') +
            ' Use list_national_parks to see valid slugs.',
        );
      }
      return ok(res);
    },
  );

  server.registerTool(
    'get_trail',
    {
      title: 'Get trail details',
      description:
        'Returns full details for one trail by id (from search_trails or get_national_park): description, trailhead and its coordinates, ' +
        'distance, elevation, duration, difficulty, best season, permits, safety warnings, access and water notes, and a link to the trail page with map and GPX.',
      inputSchema: {
        trail_id: z.string().min(2).max(80).describe('Trail id, e.g. "fitz-roy-laguna-tres".'),
        lang: langSchema,
      },
      annotations: { title: 'Get trail details', ...READ_ONLY },
    },
    async ({ trail_id, lang }) => {
      const t = findTrail(trail_id);
      if (!t) {
        const alt = searchTrails({ query: trail_id.replace(/[-_]/g, ' '), limit: 5 }, 'en');
        const ids = (alt.trails ?? []).map((x) => x.id);
        return fail(
          `No trail with id "${trail_id}".` +
            (ids.length ? ` Similar trails: ${ids.join(', ')}.` : ' Use search_trails to find trail ids.'),
        );
      }
      return ok(trailDetail(t, lang as Lang));
    },
  );

  server.registerTool(
    'find_trails_near',
    {
      title: 'Find trails near a location',
      description:
        'Finds trails whose trailhead is within a radius of a latitude/longitude (for example a town such as Bariloche or El Chaltén), nearest first.',
      inputSchema: {
        latitude: z.number().min(-56).max(-21).describe('Latitude in decimal degrees (Argentina spans about -21 to -56).'),
        longitude: z.number().min(-74).max(-53).describe('Longitude in decimal degrees (Argentina spans about -74 to -53).'),
        radius_km: z.number().positive().max(500).default(50).describe('Search radius in km (max 500).'),
        difficulty: z.array(z.enum(difficultyKeys)).max(4).optional().describe('Only these difficulties: easy, moderate, hard, extreme.'),
        limit: z.number().int().min(1).max(25).default(10).describe('Maximum number of trails to return (1–25).'),
        lang: langSchema,
      },
      annotations: { title: 'Find trails near a location', ...READ_ONLY },
    },
    async ({ latitude, longitude, radius_km, difficulty, limit, lang }) =>
      ok(trailsNear({ lat: latitude, lon: longitude }, radius_km, limit, lang as Lang, difficulty)),
  );

  return server;
}

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function jsonRpcError(status: number, message: string): Response {
  return withCors(
    new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message }, id: null }), {
      status,
      headers: { 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' },
    }),
  );
}

/** Punto de entrada HTTP (Request → Response), sin estado entre llamadas. */
export async function handleMcpRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
  // Sin sesiones no hay stream SSE que abrir con GET ni sesión que cerrar con
  // DELETE: el spec de Streamable HTTP pide 405 en ese caso.
  if (req.method !== 'POST') return jsonRpcError(405, 'Method not allowed. This MCP server is stateless: send JSON-RPC over POST.');

  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    return withCors(await transport.handleRequest(req));
  } catch (err) {
    console.error('[mcp] request failed', err);
    return jsonRpcError(500, 'Internal error while handling the MCP request.');
  } finally {
    // La respuesta ya está armada (enableJsonResponse): liberar el servidor.
    transport.close().catch(() => {});
    server.close().catch(() => {});
  }
}

/**
 * Servidor MCP de Sliabh, publicado en https://sliabh.com.ar/mcp.
 *
 * Toda la lógica vive en src/mcp/server.ts (probada por
 * scripts/test-mcp.mjs); esta función solo la expone como endpoint HTTP.
 * Netlify empaqueta con esbuild, que resuelve los imports TypeScript de src/.
 */
import { handleMcpRequest } from '../../src/mcp/server';

export default (req: Request) => handleMcpRequest(req);

// Una ruta propia tiene prioridad sobre el catch-all del SPA en netlify.toml.
export const config = {
  path: '/mcp',
};

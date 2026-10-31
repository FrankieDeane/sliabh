import type { Context } from 'https://edge.netlify.com';

/**
 * Servidor de actualizaciones automáticas de la app (protocolo expo-updates v1).
 *
 * La app instalada pregunta acá, al abrirse con señal, si hay código nuevo.
 * Manda su plataforma y su huella nativa ("runtime") en los headers; esto
 * devuelve el manifiesto que armó scripts/build-app-updates.mjs para esa
 * combinación, o 204 ("no hay nada para vos") si no existe. Un APK con otra
 * huella nativa nunca recibe código que no le corresponde.
 */
const PLATFORMS = new Set(['android', 'ios']);
const BASE_HEADERS = {
  'expo-protocol-version': '1',
  'expo-sfv-version': '0',
  'cache-control': 'private, max-age=0',
};

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const platform = request.headers.get('expo-platform') ?? url.searchParams.get('platform') ?? '';
  const runtime = request.headers.get('expo-runtime-version') ?? url.searchParams.get('runtime-version') ?? '';

  if (!PLATFORMS.has(platform) || !/^[A-Za-z0-9._-]{1,128}$/.test(runtime)) {
    return new Response('expo-platform y expo-runtime-version son obligatorios', {
      status: 400,
      headers: { ...BASE_HEADERS, 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const res = await fetch(new URL(`/app-updates/${platform}/${runtime}.json`, url.origin));
  const type = res.headers.get('content-type') ?? '';
  // Sin manifiesto para esta huella, Netlify contesta con la SPA (index.html):
  // eso no es un manifiesto, es "no hay actualización".
  if (!res.ok || !type.includes('json')) {
    return new Response(null, { status: 204, headers: BASE_HEADERS });
  }

  return new Response(await res.text(), {
    status: 200,
    headers: { ...BASE_HEADERS, 'content-type': 'application/expo+json; charset=utf-8' },
  });
};

import React from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';

const SITE_URL = 'https://sliabh.netlify.app';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SeoHeadProps {
  /** Full page title, e.g. "Rutas y senderos en Argentina | Sliabh". */
  title: string;
  description: string;
  /** Path only, starting with "/" — e.g. "/ruta/aconcagua-ruta-normal". */
  path: string;
  image?: string;
  /** One or more schema.org objects; rendered as a single JSON-LD @graph. */
  jsonLd?: object | object[];
}

/**
 * Per-page <title>/meta/canonical/OG + JSON-LD, layered on top of the
 * site-wide defaults in app/+html.tsx (expo-router/head — react-helmet-async
 * under the hood — merges into <head>, last-mounted wins per tag).
 *
 * Caveat: with the current web.output:"single" (SPA) export, every route
 * shares one static index.html, so these tags only reach the DOM once the JS
 * bundle hydrates. They still improve the browser tab title / social share
 * previews for real visitors and help Google's second-pass (JS-rendered)
 * indexing, but crawlers that don't execute JS (most non-Google AI answer
 * engines) won't see them — that needs the site's export mode to switch to
 * "static" (per-route prerendered HTML) to fully land.
 */
export function SeoHead({ title, description, path, image, jsonLd }: SeoHeadProps) {
  if (Platform.OS !== 'web') return null;

  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? DEFAULT_IMAGE;
  const graph = jsonLd
    ? { '@context': 'https://schema.org', '@graph': Array.isArray(jsonLd) ? jsonLd : [jsonLd] }
    : null;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {graph && <script type="application/ld+json">{JSON.stringify(graph)}</script>}
    </Head>
  );
}

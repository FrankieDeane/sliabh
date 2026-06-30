import type { Context } from 'https://edge.netlify.com';

/**
 * Block public access to NON-production deploys (deploy previews and branch
 * deploys), whose URLs look like `deploy-preview-123--sliabh.netlify.app` or
 * `mybranch--sliabh.netlify.app`.
 *
 * Bots/scrapers crawling those throwaway URLs were burning the monthly
 * bandwidth quota. Returning a tiny 401 here short-circuits the request before
 * Netlify serves the real HTML / JS bundle / images, so almost no bandwidth is
 * used. Production traffic (`sliabh.netlify.app` / custom domain) is never
 * touched, and local `netlify dev` keeps working.
 *
 * Edge Functions are included in Netlify's free tier, so this costs nothing.
 */
export default async (_request: Request, context: Context) => {
  // context.deploy.context is one of: "production" | "deploy-preview"
  //                                   | "branch-deploy" | "dev"
  const deployContext = context.deploy?.context;

  if (deployContext === 'deploy-preview' || deployContext === 'branch-deploy') {
    return new Response('Access restricted', {
      status: 401,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        // Belt-and-suspenders: keep these URLs out of search engines too.
        'x-robots-tag': 'noindex, nofollow',
        // Let the CDN/clients cache the rejection so repeat bot hits are cheap.
        'cache-control': 'public, max-age=86400',
      },
    });
  }

  // Production (and local dev): let the request continue to be served normally.
  return;
};

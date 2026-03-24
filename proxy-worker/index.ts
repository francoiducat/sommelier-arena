/**
 * Cloudflare Worker — Sommelier Arena proxy
 *
 * Routes:
 *   /docs/*  → DOCS_ORIGIN (Docusaurus static site, default: sommelier-arena-docs.pages.dev)
 *   /*       → pass-through (handled by Cloudflare Pages for the front app)
 *
 * Environment variables (set in Cloudflare dashboard or wrangler.toml):
 *   DOCS_ORIGIN  — origin URL of the Docusaurus Pages project (no trailing slash)
 *                  Default: https://sommelier-arena-docs.pages.dev
 *
 * See proxy-worker/README.md for deployment instructions.
 */

interface Env {
  DOCS_ORIGIN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const docsOrigin = env.DOCS_ORIGIN ?? 'https://sommelier-arena-docs.pages.dev';

    if (url.pathname.startsWith('/docs')) {
      const docsPath = url.pathname.replace(/^\/docs/, '') || '/';
      const proxied = new URL(docsPath, docsOrigin);
      proxied.search = url.search;

      const proxyReq = new Request(proxied.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        redirect: 'follow',
      });

      const response = await fetch(proxyReq);

      // Re-write absolute URLs in HTML so links stay on the main domain
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('text/html')) {
        const text = await response.text();
        const rewritten = text.replace(
          new RegExp(docsOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          `${url.protocol}//${url.host}`,
        );
        return new Response(rewritten, {
          status: response.status,
          headers: response.headers,
        });
      }

      return response;
    }

    // All other routes: pass through to Cloudflare Pages (front app)
    return fetch(request);
  },
} satisfies ExportedHandler<Env>;

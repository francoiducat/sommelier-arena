/**
 * Cloudflare Worker — Sommelier Arena proxy
 *
 * Routes:
 *   /docs/*  → sommelier-arena-docs.pages.dev (Docusaurus static site)
 *   /*       → pass-through (handled by Cloudflare Pages for the front app)
 *
 * Deploy:
 *   Workers & Pages → Create Worker → paste this file → Deploy
 *   Then add route: sommelier-arena.ducatillon.net/docs* → this worker
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/docs')) {
      // Strip /docs prefix and proxy to the docs Pages project
      const docsOrigin = 'https://sommelier-arena-docs.pages.dev';
      const proxied = new URL(url.pathname, docsOrigin);
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
          /https:\/\/sommelier-arena-docs\.pages\.dev/g,
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
} satisfies ExportedHandler;

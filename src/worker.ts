/**
 * Cloudflare Worker entry point for Digital Product Sheba.
 * Authoritatively serves static assets from `dist` with SPA routing,
 * enforces strict anti-caching headers for HTML shells, and provides
 * safe non-secret diagnostic endpoints.
 */

export interface Env {
  ASSETS?: {
    fetch: (request: Request | string) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Safe non-secret Health & Diagnostic endpoints
    if (url.pathname === '/api/health' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'Digital Product Sheba Cloudflare Worker',
          appName: 'Digital Product Sheba',
          projectId: 'digiral-product-service',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-App-Name': 'Digital Product Sheba',
          },
        }
      );
    }

    if (url.pathname === '/api/diagnostic') {
      return new Response(
        JSON.stringify({
          appName: 'Digital Product Sheba',
          buildVersion: '2.0.0',
          deploymentTarget: 'Cloudflare Workers (workers.dev)',
          assetSource: 'dist',
          firebaseProject: 'digiral-product-service',
          activeRuntime: 'Cloudflare Worker with Static Assets',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-App-Name': 'Digital Product Sheba',
          },
        }
      );
    }

    // 2. Static Assets Serving via Cloudflare env.ASSETS
    if (!env.ASSETS) {
      return new Response(
        'Digital Product Sheba: ASSETS binding is initializing or not bound in wrangler configuration.',
        { status: 503, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    let response: Response;
    try {
      response = await env.ASSETS.fetch(request);
    } catch {
      // Fallback to fetching /index.html
      response = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }

    // Single-Page Application (SPA) fallback: If route not found and not an API route, serve index.html
    if (response.status === 404 && !url.pathname.startsWith('/api/')) {
      const indexReq = new Request(new URL('/index.html', request.url), request);
      response = await env.ASSETS.fetch(indexReq);
    }

    // 3. Cache-Control Security: HTML files must NEVER be cached by browser or CDN
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || url.pathname.endsWith('.html') || url.pathname === '/') {
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      newHeaders.set('Pragma', 'no-cache');
      newHeaders.set('Expires', '0');
      newHeaders.set('X-App-Name', 'Digital Product Sheba');
      newHeaders.set('X-Deploy-Source', 'Cloudflare-Worker-Assets');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    // 4. Versioned static assets (/assets/*) can be safely cached long-term
    if (url.pathname.startsWith('/assets/')) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return response;
  },
};

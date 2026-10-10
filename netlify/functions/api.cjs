const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

// Dynamically load bundled server from Netlify Function folder or dist directory
let app;
let lastLoadError = null;

// Primary direct require from the same directory where Netlify bundles/places server.cjs
try {
  const mod = require('./server.cjs');
  app = mod.app || mod.default || mod;
} catch (e1) {
  lastLoadError = e1;
  // Fallback to explicit absolute path candidates
  const candidatePaths = [
    path.join(__dirname, 'server.cjs'),
    path.join(__dirname, '../server.cjs'),
    path.join(__dirname, '../../dist/server.cjs'),
    path.join(__dirname, '../dist/server.cjs'),
    path.join(process.cwd(), 'netlify/functions/server.cjs'),
    path.join(process.cwd(), 'dist/server.cjs'),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const mod = require(candidate);
        app = mod.app || mod.default || mod;
        if (app) break;
      }
    } catch (err) {
      lastLoadError = err;
      console.warn('[Netlify Function api.cjs] Failed loading candidate:', candidate, err.message);
    }
  }
}

let serverlessHandler = null;
if (app) {
  try {
    serverlessHandler = serverless(app);
  } catch (shErr) {
    console.error('[Netlify Function api.cjs] Error wrapping Express app with serverless-http:', shErr);
  }
}

exports.handler = async (event, context) => {
  if (serverlessHandler) {
    return serverlessHandler(event, context);
  }

  // If app wasn't loaded at startup, attempt one lazy load retry
  if (!app) {
    try {
      const mod = require('./server.cjs');
      app = mod.app || mod.default || mod;
      if (app) {
        serverlessHandler = serverless(app);
        return serverlessHandler(event, context);
      }
    } catch (retryErr) {
      lastLoadError = retryErr;
    }
  }

  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: 'SERVER_BUNDLE_NOT_FOUND: Express app bundle could not be loaded in Netlify Function runtime.',
      details: lastLoadError ? lastLoadError.message : 'Unknown bundle resolution error',
    }),
  };
};


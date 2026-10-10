const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

// Dynamically load bundled server from dist or local function root
let app;
const candidatePaths = [
  path.join(__dirname, 'server.cjs'),
  path.join(__dirname, '../../dist/server.cjs'),
  path.join(__dirname, '../dist/server.cjs'),
  path.join(process.cwd(), 'dist/server.cjs'),
  path.join(process.cwd(), 'netlify/functions/server.cjs'),
];

for (const candidate of candidatePaths) {
  try {
    if (fs.existsSync(candidate)) {
      const mod = require(candidate);
      app = mod.app || mod.default || mod;
      if (app) break;
    }
  } catch (err) {
    console.warn('[Netlify Function api.cjs] Candidate load warning:', candidate, err.message);
  }
}

if (!app) {
  try {
    const mod = require('./server.cjs');
    app = mod.app || mod.default || mod;
  } catch {
    try {
      const mod = require('../../dist/server.cjs');
      app = mod.app || mod.default || mod;
    } catch (e) {
      console.error('[Netlify Function api.cjs] Fatal: failed to load server bundle:', e.message);
    }
  }
}

exports.handler = app
  ? serverless(app)
  : async (event, context) => ({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'SERVER_BUNDLE_NOT_FOUND: Express app bundle could not be loaded in Netlify Function runtime.',
      }),
    });


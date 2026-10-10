const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

// Reference firebase-admin so Netlify's bundler analyzer reliably includes it in runtime package
try {
  require('firebase-admin');
} catch (_) {}

let app = null;
let serverlessHandler = null;
let loadDiagnostics = {
  lastError: null,
  attemptedCandidates: [],
  successfulCandidate: null,
};

function loadApp() {
  if (app && serverlessHandler) return serverlessHandler;

  const candidatePaths = [
    // 1. Direct local file relative to executing directory
    path.join(__dirname, 'server.cjs'),
    // 2. Included file relative to Lambda task root
    path.join(__dirname, 'dist', 'server.cjs'),
    path.join(__dirname, 'netlify', 'functions', 'server.cjs'),
    // 3. Current working directory variants
    path.join(process.cwd(), 'netlify', 'functions', 'server.cjs'),
    path.join(process.cwd(), 'dist', 'server.cjs'),
    path.join(process.cwd(), 'server.cjs'),
    // 4. Upward directory traversals
    path.join(__dirname, '..', 'server.cjs'),
    path.join(__dirname, '..', 'dist', 'server.cjs'),
    path.join(__dirname, '..', '..', 'dist', 'server.cjs'),
    // 5. AWS Lambda standard task root
    '/var/task/netlify/functions/server.cjs',
    '/var/task/dist/server.cjs',
    '/var/task/server.cjs',
  ];

  // Also include direct relative require
  try {
    const mod = require('./server.cjs');
    const candidateApp = mod.app || mod.default || mod;
    if (candidateApp && typeof candidateApp === 'function') {
      app = candidateApp;
      loadDiagnostics.successfulCandidate = './server.cjs (direct require)';
      serverlessHandler = serverless(app);
      return serverlessHandler;
    }
  } catch (err) {
    loadDiagnostics.attemptedCandidates.push({
      path: './server.cjs (direct require)',
      exists: true,
      error: err ? err.message : 'Unknown error',
    });
  }

  for (const candidate of candidatePaths) {
    let exists = false;
    try {
      exists = fs.existsSync(candidate);
    } catch (_) {}

    if (exists) {
      try {
        const mod = require(candidate);
        const candidateApp = mod.app || mod.default || mod;
        if (candidateApp && typeof candidateApp === 'function') {
          app = candidateApp;
          loadDiagnostics.successfulCandidate = candidate;
          serverlessHandler = serverless(app);
          return serverlessHandler;
        }
      } catch (err) {
        loadDiagnostics.lastError = err;
        loadDiagnostics.attemptedCandidates.push({
          path: candidate,
          exists: true,
          error: err ? err.message : 'Load failed',
        });
      }
    } else {
      loadDiagnostics.attemptedCandidates.push({
        path: candidate,
        exists: false,
        error: 'File does not exist',
      });
    }
  }

  return null;
}

// Initial bootstrap attempt
loadApp();

exports.handler = async (event, context) => {
  // Ensure handler is ready
  const handler = serverlessHandler || loadApp();

  if (handler) {
    // Forward to Express application
    return handler(event, context);
  }

  // Safe file list inspection for diagnostics
  let filesInDir = [];
  try {
    filesInDir = fs.readdirSync(__dirname);
  } catch (_) {}

  let filesInCwd = [];
  try {
    filesInCwd = fs.readdirSync(process.cwd());
  } catch (_) {}

  const diagnosticPayload = {
    error: 'SERVER_BUNDLE_NOT_FOUND: Express app bundle could not be loaded in Netlify Function runtime.',
    details: loadDiagnostics.lastError ? loadDiagnostics.lastError.message : 'No candidate bundle path succeeded',
    diagnostics: {
      timestamp: new Date().toISOString(),
      __dirname: __dirname,
      cwd: process.cwd(),
      filesInDirname: filesInDir,
      filesInCwd: filesInCwd,
      attemptedCandidates: loadDiagnostics.attemptedCandidates,
    },
  };

  console.error('[Netlify Function api.cjs Fatal Error]', JSON.stringify(diagnosticPayload, null, 2));

  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(diagnosticPayload),
  };
};



const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 5173;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // Add CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  } catch (e) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname === '/') pathname = '/index.html';

  const safePath = path.normalize(path.join(ROOT, pathname));

  // Protect against directory traversal
  if (!safePath.startsWith(ROOT)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // ETag caching support for sub-second reloads
    const etag = `"${stats.size}-${stats.mtimeMs}"`;
    res.setHeader('ETag', etag);

    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304;
      res.end();
      return;
    }

    // Cache-Control headers
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }

    const acceptEncoding = req.headers['accept-encoding'] || '';
    const shouldGzip = Boolean(
      acceptEncoding.includes('gzip') &&
      stats.size > 1024 &&
      ['.html', '.js', '.css', '.json', '.svg'].includes(ext)
    );

    if (shouldGzip) {
      res.setHeader('Content-Encoding', 'gzip');
      const rawStream = fs.createReadStream(safePath);
      const gzipStream = zlib.createGzip({ level: 6 });
      rawStream.pipe(gzipStream).pipe(res);
    } else {
      res.setHeader('Content-Length', stats.size);
      const rawStream = fs.createReadStream(safePath);
      rawStream.pipe(res);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[High-Performance Server] Running on http://127.0.0.1:${PORT}`);
});

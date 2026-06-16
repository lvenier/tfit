#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const path = require('path');

const host = process.env.HOST;
const port = parseInt(process.env.PORT, 10) || 8000;
const root = process.cwd();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function send404(res, pathname) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`Not found: ${pathname}`);
}

function send500(res, err) {
  res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`Server error: ${err.message}`);
}

function serveFile(filePath, req, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return send404(res, req.url || '');
      }
      return send500(res, err);
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  const cleanPath = decodeURIComponent(requestUrl.pathname || '/')
    .replace(/(\.\.[/\\])/g, '')
    .replace(/^\/+/, '');
  let target = path.join(root, cleanPath);

  if (target.endsWith(path.sep)) {
    target = path.join(target, 'index.html');
  }

  fs.stat(target, (err, stat) => {
    if (err) {
      return send404(res, req.url || '');
    }

    if (stat.isDirectory()) {
      return serveFile(path.join(target, 'index.html'), req, res);
    }

    return serveFile(target, req, res);
  });
});

server.listen(port, host, () => {
  const hostLabel = host || 'localhost';
  process.stdout.write(`Test server running at http://${hostLabel}:${port}\n`);
});

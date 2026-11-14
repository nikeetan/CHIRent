import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve(process.env.STATIC_DIR || 'public');
const base = '/' + (process.env.BASE_PATH || '').split('/').filter(Boolean).join('/');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/geo+json', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (base !== '/') {
      if (pathname === base) { res.writeHead(302, { Location: base + '/' }); return res.end(); }
      if (!pathname.startsWith(base + '/')) { res.writeHead(404); return res.end('Not found'); }
      pathname = pathname.slice(base.length);
    }
    const file = resolve(root, pathname === '/' ? 'index.html' : '.' + pathname);
    if (!file.startsWith(root + '/')) { res.writeHead(403); return res.end('Forbidden'); }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT || 5173), '127.0.0.1', () => console.log(`ChiRent ready at http://localhost:${server.address().port}${base === '/' ? '/' : base + '/'}`));

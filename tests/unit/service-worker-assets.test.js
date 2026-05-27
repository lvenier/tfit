import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readCoreAssets() {
  const source = readFileSync(resolve('service-worker-assets.js'), 'utf8');
  const match = source.match(/self\.CORE_ASSETS=(\[[\s\S]*\]);\s*$/);

  if (!match) {
    throw new Error('service-worker-assets.js does not expose self.CORE_ASSETS');
  }

  return JSON.parse(match[1]);
}

function readIndexPaths(pattern) {
  const indexHtml = readFileSync(resolve('index.html'), 'utf8');
  return [...indexHtml.matchAll(pattern)].map(match => `./${match[1]}`);
}

describe('service worker asset manifest', () => {
  it('loads the generated core asset list from the worker', () => {
    const serviceWorker = readFileSync(resolve('service-worker.js'), 'utf8');

    expect(serviceWorker).toContain("importScripts('/service-worker-version.js', '/service-worker-assets.js')");
    expect(serviceWorker).toContain('cache.addAll(self.CORE_ASSETS)');
  });

  it('includes every app shell script from index.html', () => {
    const coreAssets = readCoreAssets();
    const scriptPaths = readIndexPaths(/<script\s+[^>]*src="([^"]+)"/g);

    expect(coreAssets).toEqual(expect.arrayContaining(scriptPaths));
  });

  it('includes the static shell and local pose model files', () => {
    const coreAssets = readCoreAssets();

    expect(coreAssets).toEqual(expect.arrayContaining([
      './',
      './index.html',
      './manifest.json',
      './style.css',
      './js/ml5js/model.json',
      './js/ml5js/group1-shard1of3.bin',
      './js/ml5js/group1-shard2of3.bin',
      './js/ml5js/group1-shard3of3.bin'
    ]));
    expect(new Set(coreAssets).size).toBe(coreAssets.length);
  });
});

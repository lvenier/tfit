import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script } from 'node:vm';

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const cacheName = `box4fit-v${packageJson.version}`;

function createCacheStore(existingCaches = {}) {
  const stores = new Map(
    Object.entries(existingCaches).map(([name, values]) => [
      name,
      new Map(Object.entries(values))
    ])
  );
  const addAllCalls = [];
  const deletedCaches = [];

  return {
    addAllCalls,
    caches: {
      delete: vi.fn(async name => {
        deletedCaches.push(name);
        return stores.delete(name);
      }),
      keys: vi.fn(async () => [...stores.keys()]),
      match: vi.fn(async request => {
        for (const store of stores.values()) {
          if (store.has(request.url || request)) {
            return store.get(request.url || request);
          }
        }
        return undefined;
      }),
      open: vi.fn(async name => {
        if (!stores.has(name)) {
          stores.set(name, new Map());
        }
        const store = stores.get(name);
        return {
          addAll: vi.fn(async assets => {
            addAllCalls.push(assets);
          }),
          put: vi.fn(async (request, response) => {
            store.set(request.url || request, response);
          })
        };
      })
    },
    deletedCaches,
    stores
  };
}

function loadServiceWorker(existingCaches) {
  const listeners = {};
  const cacheStore = createCacheStore(existingCaches);
  const self = {
    addEventListener: (name, listener) => {
      listeners[name] = listener;
    },
    clients: {
      claim: vi.fn(async () => {})
    },
    importScripts: (...paths) => {
      for (const path of paths) {
        const source = readFileSync(resolve(path.replace(/^\//, '')), 'utf8');
        new Script(source, { filename: path }).runInNewContext(sandbox);
      }
    },
    skipWaiting: vi.fn(async () => {})
  };
  const sandbox = {
    caches: cacheStore.caches,
    fetch: vi.fn(),
    importScripts: self.importScripts,
    self
  };

  new Script(readFileSync(resolve('service-worker.js'), 'utf8'), {
    filename: 'service-worker.js'
  }).runInNewContext(sandbox);

  return {
    ...cacheStore,
    fetch: sandbox.fetch,
    listeners,
    self
  };
}

describe('service worker cache behavior', () => {
  it('precaches the generated core assets on install', async () => {
    const worker = loadServiceWorker();
    const waitUntil = vi.fn(promise => promise);

    worker.listeners.install({ waitUntil });
    await waitUntil.mock.calls[0][0];

    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(worker.caches.open).toHaveBeenCalledWith(cacheName);
    expect(worker.addAllCalls[0]).toContain('./index.html');
    expect(worker.addAllCalls[0]).toContain('./js/app.js');
    expect(worker.self.skipWaiting).toHaveBeenCalledTimes(1);
  });

  it('deletes stale versioned caches on activate', async () => {
    const worker = loadServiceWorker({
      'box4fit-v0.0.1': {},
      [cacheName]: {}
    });
    const waitUntil = vi.fn(promise => promise);

    worker.listeners.activate({ waitUntil });
    await waitUntil.mock.calls[0][0];

    expect(worker.deletedCaches).toEqual(['box4fit-v0.0.1']);
    expect(worker.self.clients.claim).toHaveBeenCalledTimes(1);
  });

  it('serves matching GET requests from cache before the network', async () => {
    const cachedResponse = { body: 'cached' };
    const worker = loadServiceWorker({
      [cacheName]: {
        '/index.html': cachedResponse
      }
    });
    const respondWith = vi.fn(promise => promise);

    await worker.listeners.fetch({
      request: {
        method: 'GET',
        url: '/index.html'
      },
      respondWith
    });

    await expect(respondWith.mock.results[0].value).resolves.toBe(cachedResponse);
    expect(worker.fetch).not.toHaveBeenCalled();
  });
});

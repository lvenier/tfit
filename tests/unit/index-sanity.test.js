import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readIndex() {
  return readFileSync(resolve('index.html'), 'utf8');
}

function readManifest() {
  return JSON.parse(readFileSync(resolve('manifest.json'), 'utf8'));
}

function scriptSources(html) {
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(match => match[1]);
}

describe('index.html app surface', () => {
  it('keeps classic script dependencies in load order', () => {
    const scripts = scriptSources(readIndex());

    expect(scripts).toContain('js/game-config.js');
    expect(scripts).toContain('js/game-state.js');
    expect(scripts).toContain('js/game-logic.js');
    expect(scripts).toContain('js/game-background.js');
    expect(scripts).toContain('js/game-render.js');
    expect(scripts).toContain('js/opponent/cyril.js');
    expect(scripts).toContain('js/opponent/lav.js');
    expect(scripts).toContain('js/game-flow.js');
    expect(scripts).toContain('js/loading-progress.js');
    expect(scripts).toContain('js/screen-router.js');
    expect(scripts).toContain('js/app-bootstrap.js');
    expect(scripts.at(-1)).toBe('js/app.js');
    expect(scripts.indexOf('js/game-config.js')).toBeLessThan(scripts.indexOf('js/game-state.js'));
    expect(scripts.indexOf('js/game-background.js')).toBeLessThan(scripts.indexOf('js/game-render.js'));
    expect(scripts.indexOf('js/game-logic.js')).toBeLessThan(scripts.indexOf('js/game-render.js'));
    expect(scripts.indexOf('js/game-render.js')).toBeLessThan(scripts.indexOf('js/opponent/cyril.js'));
    expect(scripts.indexOf('js/opponent/vehbo.js')).toBeLessThan(scripts.indexOf('js/opponent/lav.js'));
    expect(scripts.indexOf('js/game-flow.js')).toBeLessThan(scripts.indexOf('js/screen-router.js'));
    expect(scripts.indexOf('js/loading-progress.js')).toBeLessThan(scripts.indexOf('js/app-lifecycle.js'));
    expect(scripts.indexOf('js/app-bootstrap.js')).toBeLessThan(scripts.indexOf('js/app.js'));
  });

  it('keeps required shell metadata and loading affordances', () => {
    const html = readIndex();

    expect(html).toContain('<title>Box4Fit</title>');
    expect(html).toContain('<link rel="manifest" href="manifest.json" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="assets/logos/logo.192.png">');
    expect(html).toContain('<div id="p5_loading">');
    expect(html).toContain('<button class="pwa-install-button" id="pwa-install-button" type="button">Install Box4Fit</button>');
    expect(html).toContain('<progress class="loading-progress" id="loading-progress"');
    expect(html).toContain('<noscript>Box4Fit needs JavaScript enabled to run the webcam boxing game.</noscript>');
  });

  it('keeps the manifest installable across root and subpath hosting', () => {
    const manifest = readManifest();

    expect(manifest.id).toBe('/');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.display_override).toEqual(['window-controls-overlay', 'standalone', 'minimal-ui']);
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({
        src: 'assets/logos/logo.192.png',
        sizes: '192x192',
        purpose: expect.stringContaining('any')
      }),
      expect.objectContaining({
        src: 'assets/logos/logo.512.png',
        sizes: '512x512',
        purpose: expect.stringContaining('any')
      })
    ]));
  });
});

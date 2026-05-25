import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readIndex() {
  return readFileSync(resolve('index.html'), 'utf8');
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
    expect(scripts).toContain('js/game-render.js');
    expect(scripts).toContain('js/game-flow.js');
    expect(scripts).toContain('js/screen-router.js');
    expect(scripts).toContain('js/app-bootstrap.js');
    expect(scripts.at(-1)).toBe('js/app.js');
    expect(scripts.indexOf('js/game-config.js')).toBeLessThan(scripts.indexOf('js/game-state.js'));
    expect(scripts.indexOf('js/game-logic.js')).toBeLessThan(scripts.indexOf('js/game-render.js'));
    expect(scripts.indexOf('js/game-flow.js')).toBeLessThan(scripts.indexOf('js/screen-router.js'));
    expect(scripts.indexOf('js/app-bootstrap.js')).toBeLessThan(scripts.indexOf('js/app.js'));
  });

  it('keeps required shell metadata and loading affordances', () => {
    const html = readIndex();

    expect(html).toContain('<title>Box4Fit</title>');
    expect(html).toContain('<link rel="manifest" href="manifest.json" />');
    expect(html).toContain('<div id="p5_loading">');
    expect(html).toContain('<noscript>Box4Fit needs JavaScript enabled to run the webcam boxing game.</noscript>');
  });
});

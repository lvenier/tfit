import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('version injection', () => {
  it('loads version.js in index.html', () => {
    const indexHtml = readFileSync(resolve('index.html'), 'utf8');

    expect(indexHtml).toContain('js/version.js');
  });

  it('matches package.json version', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve('package.json'), 'utf8')
    );

    const versionJs = readFileSync(
      resolve('js/version.js'),
      'utf8'
    );

    expect(versionJs).toContain(
      `globalThis.APP_VERSION = "Box4Fit © 2026 (v${packageJson.version})"`
    );
  });
});
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('index.html version label', () => {
  it('matches package.json', () => {
    const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    const indexHtml = readFileSync(resolve('index.html'), 'utf8');

    expect(indexHtml).toContain(`Box4Fit © 2026 (v${packageJson.version})`);
  });
});

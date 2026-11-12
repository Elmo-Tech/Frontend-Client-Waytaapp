import { legacySourceUrl } from '../../../../tests/contracts/source-files.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from '../../../../tests/contracts/source-files.mjs';

const root = new URL('../../', legacySourceUrl("src/lib/public-menu/bloom-typography.contract.test.mjs"));
const layout = readFileSync(new URL('app/q/layout.tsx', root), 'utf8');
const css = readFileSync(new URL('app/globals.css', root), 'utf8');
const hero = readFileSync(new URL('app/q/[publicCode]/GuestHeroBloom.tsx', root), 'utf8');
const fonts = readFileSync(new URL('fonts/guest.module.css', root), 'utf8');
const design = css.split('/* ---- BLOOM premium patisserie design')[1];

test('BLOOM loads exactly Cormorant Garamond normal + real italic and Arabic Tajawal', () => {
  assert.ok(layout.includes('fonts.bloomDisplay') && layout.includes('fonts.bloomArabic'));
  assert.match(fonts, /font-family: 'Cormorant Garamond';\s+font-style: normal/);
  assert.match(fonts, /font-family: 'Cormorant Garamond';\s+font-style: italic/);
  assert.ok(fonts.includes("--font-bloom-display: 'Cormorant Garamond'"));
  assert.ok(fonts.includes("--font-bloom-arabic: 'Tajawal'"));
  assert.ok(css.includes('font-family: var(--font-bloom-display), var(--font-bloom-arabic), Georgia, serif'));
  assert.ok(hero.includes('<i>{p.bloomHeadlineMiddle'));
});
test('BLOOM keeps pastel defaults, 3 color schemes and dark mode from existing guest theme', () => {
  assert.ok(design);
  for (const selector of [
    '.bloom-v2-ribbon', '.bloom-v2-hero', '.bloom-v2-card',
    '.bloom-v2-tabs', ".bloom-experience[data-bloom-palette='LILAC']",
    ".bloom-experience[data-bloom-palette='PEACH']",
    "[data-guest-theme='dark'] .bloom-experience",
    "[data-guest-theme='dark'] .bloom-experience[data-bloom-palette='LILAC']",
    "[data-guest-theme='dark'] .bloom-experience[data-bloom-palette='PEACH']",
    "data-bloom-motion='OFF'",
  ]) assert.ok(design.includes(selector), 'missing '+selector);
  assert.ok(design.includes('--g-accent: #b44d6b;'));
});


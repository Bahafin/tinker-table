import { describe, expect, test } from 'vitest';
// @ts-expect-error: a plain JavaScript build script
import { androidAssetLinks, appleAssociation, fingerprint } from '../scripts/site-links.mjs';

const FP = 'ab'.repeat(32);
const FP_COLONS = 'AB:'.repeat(31) + 'AB';

describe('links into the app', () => {
  test('iOS: the Team ID and bundle ID, for /play and below', () => {
    expect(appleAssociation(' ABCDE12345 ')).toEqual({
      applinks: { details: [{ appIDs: ['ABCDE12345.app.bumpity.game'], components: [{ '/': '/play' }, { '/': '/play/*' }] }] },
    });
  });

  test('iOS: nothing until there is a real Team ID', () => {
    for (const id of [undefined, '', 'abc', 'abcde12345', 'ABCDE123456']) expect(appleAssociation(id)).toBeNull();
  });

  test('Android: fingerprints in any spelling come out the way Google wants them', () => {
    expect(fingerprint(FP)).toBe(FP_COLONS);
    expect(fingerprint(FP_COLONS.toLowerCase())).toBe(FP_COLONS);
    expect(fingerprint('AB:CD')).toBeNull();
    const links = androidAssetLinks(`${FP_COLONS}, ${FP}\n${'CD'.repeat(32)}`);
    expect(links[0].target).toEqual({ namespace: 'android_app', package_name: 'app.bumpity.game', sha256_cert_fingerprints: [FP_COLONS, 'CD:'.repeat(31) + 'CD'] });
    expect(links[0].relation).toEqual(['delegate_permission/common.handle_all_urls']);
  });

  test('Android: nothing when a fingerprint is missing or broken', () => {
    expect(androidAssetLinks(undefined)).toBeNull();
    expect(androidAssetLinks('')).toBeNull();
    expect(androidAssetLinks(`${FP}, nope`)).toBeNull();
  });
});

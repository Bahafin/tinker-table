// The two small files at https://bumpity.app/.well-known/ that let a shared puzzle link open in
// the app when it's installed: Universal Links (iOS) and App Links (Android). Both list who
// may open links under /play. Neither holds anything secret: a Team ID and signing-key
// fingerprints are public by design.

export const APP_ID = 'app.bumpity.game';

/** apple-app-site-association, from the Apple Team ID (10 letters and digits). */
export function appleAssociation(teamId) {
  const id = String(teamId ?? '').trim();
  if (!/^[A-Z0-9]{10}$/.test(id)) return null;
  return {
    applinks: {
      details: [{ appIDs: [`${id}.${APP_ID}`], components: [{ '/': '/play' }, { '/': '/play/*' }] }],
    },
  };
}

/** One SHA-256 fingerprint, written the way Google wants it (AB:CD:…), or null if it isn't one. */
export function fingerprint(text) {
  const hex = String(text).replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  return hex.length === 64 ? hex.match(/../g).join(':') : null;
}

/** assetlinks.json, from the app's signing-key fingerprints (commas or new lines between them). */
export function androidAssetLinks(fingerprints) {
  const list = [...new Set(String(fingerprints ?? '').split(/[,\s]+/).filter(Boolean).map(fingerprint))];
  if (!list.length || list.includes(null)) return null;
  return [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: APP_ID, sha256_cert_fingerprints: list },
  }];
}

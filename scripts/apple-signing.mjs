// Signing for TestFlight without a Mac or a registered device, using the App Store Connect API
// key in the repository's secrets. Used by .github/workflows/ios.yml:
//   node scripts/apple-signing.mjs setup <csr.pem> <outdir>
//     makes an Apple Distribution certificate from the CSR (writes <outdir>/dist.cer), makes sure
//     the app ID has Associated Domains (shared links open in the app), and makes an App Store
//     profile (writes <outdir>/app.mobileprovision). Prints the names for $GITHUB_ENV.
//   node scripts/apple-signing.mjs cleanup <certId> <profileId>
//     deletes them again. Builds already uploaded stay valid: Apple re-signs what it ships.
// Needs ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_P8 in the environment.
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const BUNDLE = 'app.bumpity.game';
const API = 'https://api.appstoreconnect.apple.com/v1';
const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8 } = process.env;
if (!ASC_KEY_ID || !ASC_ISSUER_ID || !ASC_KEY_P8) throw new Error('ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_P8 are needed');

const b64url = (x) => Buffer.from(x).toString('base64url');
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'ES256', kid: ASC_KEY_ID, typ: 'JWT' }));
  const body = b64url(JSON.stringify({ iss: ASC_ISSUER_ID, iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' }));
  const sig = sign('sha256', Buffer.from(`${head}.${body}`), { key: createPrivateKey(ASC_KEY_P8), dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64url(sig)}`;
}

async function api(method, path, data) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: data ? JSON.stringify({ data }) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const [cmd, a, b] = process.argv.slice(2);

if (cmd === 'setup') {
  const csr = readFileSync(a, 'utf8').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

  const bundle = (await api('GET', `/bundleIds?filter[identifier]=${BUNDLE}&limit=20`)).data
    .find((x) => x.attributes.identifier === BUNDLE && x.attributes.platform !== 'MAC_OS');
  if (!bundle) throw new Error(`No app ID ${BUNDLE} in the Apple account (docs/app.md, step 2)`);
  const caps = (await api('GET', `/bundleIds/${bundle.id}/bundleIdCapabilities`)).data;
  if (!caps.some((c) => c.attributes.capabilityType === 'ASSOCIATED_DOMAINS')) {
    await api('POST', '/bundleIdCapabilities', {
      type: 'bundleIdCapabilities',
      attributes: { capabilityType: 'ASSOCIATED_DOMAINS' },
      relationships: { bundleId: { data: { type: 'bundleIds', id: bundle.id } } },
    });
    console.error('Turned on Associated Domains for', BUNDLE);
  }

  const cert = (await api('POST', '/certificates', {
    type: 'certificates', attributes: { certificateType: 'DISTRIBUTION', csrContent: csr },
  })).data;
  writeFileSync(`${b}/dist.cer`, Buffer.from(cert.attributes.certificateContent, 'base64'));

  const name = `Bumpity CI ${stamp}`;
  const profile = (await api('POST', '/profiles', {
    type: 'profiles',
    attributes: { name, profileType: 'IOS_APP_STORE' },
    relationships: {
      bundleId: { data: { type: 'bundleIds', id: bundle.id } },
      certificates: { data: [{ type: 'certificates', id: cert.id }] },
    },
  })).data;
  writeFileSync(`${b}/app.mobileprovision`, Buffer.from(profile.attributes.profileContent, 'base64'));

  console.log(`APPLE_CERT_ID=${cert.id}`);
  console.log(`APPLE_PROFILE_ID=${profile.id}`);
  console.log(`APPLE_PROFILE_UUID=${profile.attributes.uuid}`);
  console.log(`APPLE_PROFILE_NAME=${name}`);
} else if (cmd === 'cleanup') {
  if (b) await api('DELETE', `/profiles/${b}`).catch((e) => console.error(e.message));
  if (a) await api('DELETE', `/certificates/${a}`).catch((e) => console.error(e.message));
} else {
  throw new Error('usage: apple-signing.mjs setup <csr.pem> <outdir> | cleanup <certId> <profileId>');
}

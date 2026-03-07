#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { encrypt, readPassword, ask } = require('./lib/vault');

const ROOT = path.resolve(__dirname, '..');

async function main() {
  console.log('===============================');
  console.log('  MedEase — Encrypt Secrets');
  console.log('===============================');
  console.log();
  console.log('Enter the real values for each secret.');
  console.log('These will be AES-256 encrypted and saved to secrets.enc.');
  console.log();

  const cfSecret = await ask('  CLOUDFLARE_SECRET_KEY: ');
  const cfSite = await ask('  VITE_CLOUDFLARE_SITE_KEY: ');
  const jwt = await ask('  JWT_SECRET: ');
  const refreshSecret = await ask('  REFRESH_TOKEN_SECRET: ');

  console.log();
  console.log('AWS S3 (Profile Image Uploads):');
  const s3Bucket = await ask('  S3_BUCKET: ');
  const s3AccessKey = await ask('  S3_ACCESS_KEY_ID: ');
  const s3SecretKey = await ask('  S3_SECRET_ACCESS_KEY: ');

  console.log();

  let password;
  while (true) {
    const pass1 = await readPassword('  Encryption password: ');
    const pass2 = await readPassword('  Confirm password: ');
    if (pass1 === pass2) {
      password = pass1;
      break;
    }
    console.log('  Passwords do not match. Try again.');
    console.log();
  }

  const plaintext = [
    'CLOUDFLARE_SECRET_KEY=' + cfSecret,
    'VITE_CLOUDFLARE_SITE_KEY=' + cfSite,
    'JWT_SECRET=' + jwt,
    'REFRESH_TOKEN_SECRET=' + refreshSecret,
    'S3_BUCKET=' + s3Bucket,
    'S3_ACCESS_KEY_ID=' + s3AccessKey,
    'S3_SECRET_ACCESS_KEY=' + s3SecretKey,
  ].join('\n') + '\n';

  const encrypted = encrypt(plaintext, password);
  fs.writeFileSync(path.join(ROOT, 'secrets.enc'), encrypted);

  console.log();
  console.log('secrets.enc written successfully.');
  console.log();
  console.log('Next steps:');
  console.log('  1. Commit secrets.enc to git (it is encrypted and safe).');
  console.log('  2. Share the encryption password with your team securely.');
  console.log('  3. Team members run npm start — it will ask for the password once.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

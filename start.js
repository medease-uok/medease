#!/usr/bin/env node
'use strict';

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { decrypt, readPassword, ask } = require('./scripts/lib/vault');

const ROOT = __dirname;
const PASSWORD_FILE = path.join(ROOT, '.vault-password');
const SECRETS_FILE = path.join(ROOT, 'secrets.enc');

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function injectEnvVar(filePath, key, value) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const re = new RegExp('^' + escapeRegExp(key) + '=.*', 'm');
  if (re.test(content)) {
    content = content.replace(re, key + '=' + value);
  } else {
    content += '\n' + key + '=' + value;
  }
  fs.writeFileSync(filePath, content);
}

async function main() {
  console.log('===============================');
  console.log('  MedEase Development Setup');
  console.log('===============================');
  console.log();

  // Check Docker
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch {
    console.error('Error: Docker is not running. Please start Docker and try again.');
    process.exit(1);
  }

  // Install dependencies
  console.log('Installing dependencies...');
  console.log();

  console.log('[1/2] Backend dependencies...');
  execSync('npm install', { cwd: path.join(ROOT, 'backend'), stdio: 'inherit' });

  console.log();
  console.log('[2/2] Frontend dependencies...');
  execSync('npm install', { cwd: path.join(ROOT, 'frontend'), stdio: 'inherit' });

  console.log();

  // Seed prompt
  const seedChoice = await ask('Do you want to seed the database with sample data? (y/N): ');
  const profileArgs = /^y(es)?$/i.test(seedChoice.trim()) ? ['--profile', 'seed'] : [];

  if (profileArgs.length) {
    console.log();
    console.log('Database will be seeded with sample data.');
  }

  // Copy .env.example → .env.development
  fs.copyFileSync(path.join(ROOT, 'backend', '.env.example'), path.join(ROOT, 'backend', '.env.development'));
  fs.copyFileSync(path.join(ROOT, 'frontend', '.env.example'), path.join(ROOT, 'frontend', '.env.development'));

  // Secrets
  const backendEnv = path.join(ROOT, 'backend', '.env.development');
  const frontendEnv = path.join(ROOT, 'frontend', '.env.development');

  if (fs.existsSync(SECRETS_FILE)) {
    console.log();
    let password;

    if (fs.existsSync(PASSWORD_FILE)) {
      password = fs.readFileSync(PASSWORD_FILE, 'utf8').trim();
    } else {
      password = await readPassword('Enter vault password: ');

      try {
        decrypt(SECRETS_FILE, password);
      } catch {
        console.error('Error: Incorrect password.');
        process.exit(1);
      }

      fs.writeFileSync(PASSWORD_FILE, password, { mode: 0o600 });
      console.log('Password saved to .vault-password (gitignored).');
    }

    const decrypted = decrypt(SECRETS_FILE, password);

    for (const line of decrypted.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      process.env[key] = value;
      injectEnvVar(backendEnv, key, value);
      injectEnvVar(frontendEnv, key, value);
    }

    console.log('Secrets loaded from vault.');
  } else {
    console.log();
    console.log('No secrets.enc found — using defaults from .env.example.');
    console.log('An admin can create it with: npm run encrypt-secrets');
  }

  // Start services
  console.log();
  console.log('Starting all services...');
  console.log();

  const args = ['compose', ...profileArgs, 'up', '--build', ...process.argv.slice(2)];
  const child = spawn('docker', args, { stdio: 'inherit', shell: true });

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => child.kill(sig));
  }

  child.on('close', (code) => process.exit(code ?? 1));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

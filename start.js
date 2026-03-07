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

const DB_CONTAINER = 'medease-db';
const DB_USER = 'medease_user';
const DB_NAME = 'medease';

function runSQL(sql) {
  execSync(
    `docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME}`,
    { input: sql, stdio: ['pipe', 'pipe', 'pipe'] }
  );
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function waitForDB(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      execSync(
        `docker exec ${DB_CONTAINER} pg_isready -U ${DB_USER} -d ${DB_NAME}`,
        { stdio: 'pipe' }
      );
      // Check that core schema exists (users table from 01-init.sql)
      execSync(
        `docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -tA`,
        { input: 'SELECT 1 FROM users LIMIT 1', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      break;
    } catch {
      if (i < maxAttempts - 1) {
        sleep(2000);
      } else {
        console.error('Error: Database did not become ready in time.');
        process.exit(1);
      }
    }
  }

  // Ensure RBAC tables exist (may be missing if DB was created before 02-roles-permissions.sql)
  try {
    execSync(
      `docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -tA`,
      { input: 'SELECT 1 FROM roles LIMIT 1', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch {
    console.log('RBAC tables not found — applying roles & permissions schema...');
    const sqlFile = '/docker-entrypoint-initdb.d/02-roles-permissions.sql';
    execSync(
      `docker exec ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -f ${sqlFile}`,
      { stdio: 'inherit' }
    );
    console.log('RBAC schema applied successfully.');
  }
}

function querySQL(sql) {
  return execSync(
    `docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -tA`,
    { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();
}

function createAdminUser({ firstName, lastName, email, phone, password }) {
  const esc = (s) => s.replace(/'/g, "''");
  const phoneVal = phone ? `'${esc(phone)}'` : 'NULL';

  const existing = querySQL(`SELECT id FROM users WHERE email = '${esc(email)}'`);
  if (existing) {
    console.log(`Admin user with email "${email}" already exists — skipping creation.`);
    return;
  }

  const sql = `
    WITH new_user AS (
      INSERT INTO users (email, password_hash, first_name, last_name, role, phone, is_active, email_verified)
      VALUES ('${esc(email)}', crypt('${esc(password)}', gen_salt('bf', 12)), '${esc(firstName)}', '${esc(lastName)}', 'admin', ${phoneVal}, true, true)
      RETURNING id
    )
    INSERT INTO user_roles (user_id, role_id)
    SELECT new_user.id, roles.id FROM new_user, roles WHERE roles.name = 'admin';
  `;

  runSQL(sql);
}

async function main() {
  console.log('===============================');
  console.log('  MedEase Development Setup');
  console.log('===============================');
  console.log();

  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch {
    console.error('Error: Docker is not running. Please start Docker and try again.');
    process.exit(1);
  }

  console.log('Installing dependencies...');
  console.log();

  console.log('[1/2] Backend dependencies...');
  execSync('npm install', { cwd: path.join(ROOT, 'backend'), stdio: 'inherit' });

  console.log();
  console.log('[2/2] Frontend dependencies...');
  execSync('npm install', { cwd: path.join(ROOT, 'frontend'), stdio: 'inherit' });

  console.log();

  const seedChoice = await ask('Do you want to seed the database with sample data? (y/N): ');
  const wantSeed = /^y(es)?$/i.test(seedChoice.trim());
  const profileArgs = wantSeed ? ['--profile', 'seed'] : [];

  // If not seeding, an admin user is required (otherwise there's no way to approve users)
  let adminDetails = null;
  if (!wantSeed) {
    console.log();
    console.log('No seed data — you need an initial admin account.');
    console.log('Enter details for the admin user:');
    const firstName = await ask('  First name: ');
    const lastName = await ask('  Last name: ');
    const email = await ask('  Email: ');
    const phone = await ask('  Phone (optional, press Enter to skip): ');

    let adminPassword;
    while (true) {
      const pass1 = await readPassword('  Password: ');
      if (pass1.length < 8) {
        console.log('  Password must be at least 8 characters.');
        console.log();
        continue;
      }
      const pass2 = await readPassword('  Confirm password: ');
      if (pass1 === pass2) {
        adminPassword = pass1;
        break;
      }
      console.log('  Passwords do not match. Try again.');
      console.log();
    }

    adminDetails = { firstName, lastName, email, phone, password: adminPassword };
  } else {
    console.log();
    console.log('Database will be seeded with sample data.');
  }

  fs.copyFileSync(path.join(ROOT, 'backend', '.env.example'), path.join(ROOT, 'backend', '.env.development'));
  fs.copyFileSync(path.join(ROOT, 'frontend', '.env.example'), path.join(ROOT, 'frontend', '.env.development'));

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
      if (key.startsWith('VITE_')) {
        injectEnvVar(frontendEnv, key, value);
      }
    }

    console.log('Secrets loaded from vault.');
  } else {
    console.log();
    console.log('No secrets.enc found — using defaults from .env.example.');
    console.log('An admin can create it with: npm run encrypt-secrets');
  }

  console.log();
  console.log('Starting all services...');
  console.log();

  execSync(`docker compose ${profileArgs.join(' ')} up --build -d`, { stdio: 'inherit', shell: true });

  console.log();
  console.log('Waiting for database to be ready...');
  waitForDB();

  if (adminDetails) {
    console.log('Creating admin user...');
    createAdminUser(adminDetails);
    console.log();
    console.log('Admin user created successfully!');
    console.log(`  Email: ${adminDetails.email}`);
    console.log('  Role:  admin (active, no approval needed)');
    console.log();
  }

  if (process.argv.slice(2).includes('-d')) {
    console.log('Services running in background.');
    process.exit(0);
  }

  const child = spawn('docker', ['compose', 'logs', '-f'], { stdio: 'inherit', shell: true });
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => child.kill(sig));
  }
  child.on('close', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

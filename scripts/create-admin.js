#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const { ask, readPassword } = require('./lib/vault');

const CONTAINER = 'medease-db';
const DB_USER = 'medease_user';
const DB_NAME = 'medease';

function runSQL(sql) {
  execSync(
    `docker exec -i ${CONTAINER} psql -U ${DB_USER} -d ${DB_NAME}`,
    { input: sql, stdio: ['pipe', 'pipe', 'pipe'] }
  );
}

function querySQL(sql) {
  return execSync(
    `docker exec -i ${CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -tA`,
    { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();
}

async function main() {
  console.log('================================');
  console.log('  MedEase — Create Admin User');
  console.log('================================');
  console.log();

  try {
    execSync(`docker inspect --format='{{.State.Running}}' ${CONTAINER}`, { stdio: 'pipe' });
  } catch {
    console.error(`Error: Docker container "${CONTAINER}" is not running.`);
    console.error('Start the services first: npm start');
    process.exit(1);
  }

  const firstName = await ask('  First name: ');
  const lastName = await ask('  Last name: ');
  const email = await ask('  Email: ');
  const phone = await ask('  Phone (optional, press Enter to skip): ');

  let password;
  while (true) {
    const pass1 = await readPassword('  Password: ');
    if (pass1.length < 8) {
      console.log('  Password must be at least 8 characters.');
      console.log();
      continue;
    }
    const pass2 = await readPassword('  Confirm password: ');
    if (pass1 === pass2) {
      password = pass1;
      break;
    }
    console.log('  Passwords do not match. Try again.');
    console.log();
  }

  const existing = querySQL(
    `SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`
  );
  if (existing) {
    console.log();
    console.error(`Error: A user with email "${email}" already exists.`);
    process.exit(1);
  }

  const escapedFirst = firstName.replace(/'/g, "''");
  const escapedLast = lastName.replace(/'/g, "''");
  const escapedEmail = email.replace(/'/g, "''");
  const escapedPhone = phone ? `'${phone.replace(/'/g, "''")}'` : 'NULL';
  const escapedPass = password.replace(/'/g, "''");

  const sql = `
    WITH new_user AS (
      INSERT INTO users (email, password_hash, first_name, last_name, role, phone, is_active)
      VALUES ('${escapedEmail}', crypt('${escapedPass}', gen_salt('bf', 12)), '${escapedFirst}', '${escapedLast}', 'admin', ${escapedPhone}, true)
      RETURNING id
    )
    INSERT INTO user_roles (user_id, role_id)
    SELECT new_user.id, roles.id FROM new_user, roles WHERE roles.name = 'admin';
  `;

  try {
    runSQL(sql);
  } catch (err) {
    console.log();
    console.error('Error: Failed to create admin user.');
    console.error(err.stderr ? err.stderr.toString() : err.message);
    process.exit(1);
  }

  console.log();
  console.log('Admin user created successfully!');
  console.log();
  console.log(`  Email: ${email}`);
  console.log('  Role:  admin');
  console.log('  Status: active (no approval needed)');
  console.log();
  console.log('You can now log in at http://localhost:3000/login');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

const SALT_HEADER = Buffer.from('Salted__');
const ITERATIONS = 10000;
const DIGEST = 'sha256';
const KEY_LEN = 32;
const IV_LEN = 16;

function decrypt(filePath, password) {
  const data = fs.readFileSync(filePath);
  if (data.slice(0, 8).toString() !== 'Salted__') {
    throw new Error('Invalid encrypted file format.');
  }
  const salt = data.slice(8, 16);
  const encrypted = data.slice(16);
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN + IV_LEN, DIGEST);
  const decipher = crypto.createDecipheriv('aes-256-cbc', derived.slice(0, KEY_LEN), derived.slice(KEY_LEN));
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function encrypt(plaintext, password) {
  const salt = crypto.randomBytes(8);
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN + IV_LEN, DIGEST);
  const cipher = crypto.createCipheriv('aes-256-cbc', derived.slice(0, KEY_LEN), derived.slice(KEY_LEN));
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([SALT_HEADER, salt, encrypted]);
}

function readPassword(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);

    if (!process.stdin.isTTY) {
      const rl = readline.createInterface({ input: process.stdin });
      rl.once('line', (line) => { rl.close(); resolve(line); });
      return;
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let pw = '';

    const onData = (ch) => {
      if (ch === '\r' || ch === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        console.log();
        resolve(pw);
      } else if (ch === '\u0003') {
        console.log();
        process.exit(1);
      } else if (ch === '\u007f' || ch === '\b') {
        pw = pw.slice(0, -1);
      } else {
        pw += ch;
      }
    };

    process.stdin.on('data', onData);
  });
}

function ask(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

module.exports = { decrypt, encrypt, readPassword, ask };

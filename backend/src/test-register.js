const dotenv = require('dotenv');
dotenv.config({ path: `.env.development` });

const { register } = require('./controllers/auth.controller');
const db = require('./config/database');

async function test() {
  const req = {
    body: {
      firstName: 'Direct',
      lastName: 'Test',
      email: 'directtest@example.com',
      password: 'Password123!',
      role: 'patient',
      phone: '1112223333',
      dateOfBirth: '2000-01-01',
      gender: 'male'
    },
    ip: '127.0.0.1'
  };
  
  const res = {
    status: (code) => {
      console.log('Status set to:', code);
      return res;
    },
    json: (data) => {
      console.log('Response JSON:', JSON.stringify(data, null, 2));
    }
  };
  
  const next = (err) => {
    console.error('Next called with error:', err);
  };
  
  try {
    await register(req, res, next);
  } catch (err) {
    console.error('Uncaught error:', err);
  } finally {
    // Wait for async background tasks
    setTimeout(() => process.exit(0), 4000);
  }
}

test();

const dotenv = require('dotenv');
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const express = require('express');
const cors = require('cors');
const config = require('./config');
const redis = require('./config/redis');
const db = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { startReminderScheduler } = require('./jobs/appointmentReminders');

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res) => {
  let redisStatus = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch (err) {
    redisStatus = 'disconnected';
  }

  let dbStatus = 'disconnected';
  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
  }

  res.status(200).json({
    status: 'success',
    message: 'MedEase API is running',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

app.use('/api', routes);

app.all('/api/*path', (req, res) => {
  res.status(404).json({ status: 'error', statusCode: 404, message: `${req.method} ${req.path} not found.` });
});

app.use(errorHandler);

const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  startReminderScheduler();
});

module.exports = app;

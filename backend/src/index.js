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
const { startInventoryScheduler } = require('./jobs/inventoryJobs');
const ensureViews = require('./config/ensureViews');

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

async function startServer() {
  try {
    // 1. Ensure database reporting views are initialized before accepting connections
    // This resolves MEDEASE-505 race condition
    await ensureViews();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);

      // Security: Warn about malware scanning status
      if (config.nodeEnv === 'production' && !process.env.VIRUSTOTAL_API_KEY) {
        console.warn('⚠️  WARNING: VirusTotal malware scanning is DISABLED in production.');
        console.warn('⚠️  Uploaded files will NOT be scanned for malware.');
        console.warn('⚠️  Set VIRUSTOTAL_API_KEY environment variable to enable scanning.');
        console.warn('⚠️  See backend/FILE_VALIDATION.md for HIPAA compliance considerations.');
      } else if (process.env.VIRUSTOTAL_API_KEY) {
        console.log('✓ VirusTotal malware scanning: ENABLED');
        if (config.nodeEnv === 'production') {
          console.warn('⚠️  HIPAA WARNING: VirusTotal uploads files to cloud service.');
          console.warn('⚠️  Ensure compliance with PHI data handling requirements.');
          console.warn('⚠️  See backend/FILE_VALIDATION.md for details.');
        }
      } else {
        console.log('VirusTotal malware scanning: disabled (development)');
      }

      startReminderScheduler();
      startInventoryScheduler();
    });
  } catch (err) {
    console.error('CRITICAL: Failed to start server due to view initialization failure:', err);
    process.exit(1);
  }
}

startServer();


module.exports = app;

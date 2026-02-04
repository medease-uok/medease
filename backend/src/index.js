const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'MedEase API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

app.use(errorHandler);

const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

module.exports = app;

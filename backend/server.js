require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/database');
const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');
const { startCronJobs } = require('./jobs/cronJobs');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      // Start cron jobs after server is up
      startCronJobs();
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});

module.exports = server;

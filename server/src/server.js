/**
 * FlowSync Server Entrypoint
 */
const app = require('./app');
const config = require('./config/env');
const { testDbConnection } = require('./config/db');

const startServer = async () => {
  try {
    const server = app.listen(config.port, async () => {
      console.log('====================================================');
      console.log(`🚀 FlowSync Server running in [${config.env}] mode`);
      console.log(`🌐 Server Port: http://localhost:${config.port}`);
      console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
      console.log('====================================================');

      // Test database connectivity
      console.log('Testing PostgreSQL connectivity...');
      const dbStatus = await testDbConnection();
      if (dbStatus.connected) {
        console.log(`✅ ${dbStatus.provider || 'PostgreSQL'} connected successfully`);
      } else {
        console.warn('⚠️  PostgreSQL connection warning:', dbStatus.message);
        console.warn('   (Ensure database credentials in .env are configured)');
      }
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('\nGracefully shutting down FlowSync Server...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

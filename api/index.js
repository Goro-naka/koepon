const { NestFactory } = require('@nestjs/core');

let app;

async function createNestApp() {
  if (!app) {
    const { AppModule } = require('../dist/app.module');
    
    app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log']
    });
    
    // Enable CORS for all origins
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    });
    
    await app.init();
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    const nestApp = await createNestApp();
    const server = nestApp.getHttpAdapter().getInstance();
    return server(req, res);
  } catch (error) {
    console.error('NestJS initialization failed:', error);
    
    // Fallback response for debugging
    return res.status(200).json({
      status: 'fallback',
      message: 'NestJS app initialization failed, running fallback',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    });
  }
};
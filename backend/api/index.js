const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');

let cachedInstance;

async function bootstrap() {
  if (!cachedInstance) {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: true,
      credentials: true,
    });

    await app.init();
    cachedInstance = app.getHttpAdapter().getInstance();
  }
  return cachedInstance;
}

module.exports = async (req, res) => {
  try {
    const instance = await bootstrap();
    if (req.url && req.url.startsWith('/api')) {
      req.url = req.url.replace(/^\/api/, '') || '/';
    }
    instance(req, res);
  } catch (err) {
    console.error('SERVERLESS BOOTSTRAP ERROR:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(
      JSON.stringify({
        error: 'SERVERLESS_BOOTSTRAP_ERROR',
        message: err.message,
        stack: err.stack,
      }),
    );
  }
};

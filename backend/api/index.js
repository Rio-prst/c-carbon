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
  const instance = await bootstrap();
  instance(req, res);
};

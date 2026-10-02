import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile/web clients
  app.enableCors({
    origin: [
      'http://localhost:8081', // Expo dev server
      'http://localhost:19006', // Expo web
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

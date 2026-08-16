/**
 * Vercel serverless entry-point for the NestJS API.
 *
 * `ts-node/register` is required FIRST so that workspace packages
 * (e.g. @goinze/database) that ship raw TypeScript are transpiled
 * on-the-fly when NestJS loads its modules.
 */
require('ts-node/register');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

let cachedHandler: any;
let cachedPromise: Promise<any> | null = null;

async function bootstrap(): Promise<any> {
  if (cachedHandler) return cachedHandler;

  if (!cachedPromise) {
    cachedPromise = (async () => {
      const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

      app.setGlobalPrefix('api/v1');

      app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      });

      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
        }),
      );

      await app.init();
      return app.getHttpAdapter().getInstance();
    })();
  }

  cachedHandler = await cachedPromise;
  return cachedHandler;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await bootstrap();
    return app(req, res);
  } catch (err) {
    Logger.error('Serverless handler error', err, 'VercelHandler');
    res.status(500).json({ statusCode: 500, message: 'Internal server error' });
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { corsConfig } from './cors.config';

require('events').EventEmitter.prototype._maxListeners = 100;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(cookieParser());
  app.enableCors(corsConfig);

  const config = new DocumentBuilder()
    .setTitle('Buff163 Scraper')
    .setDescription('A NestJS web application that scrapes CS:GO items')
    .setVersion('1.0')
    .addTag('scraper')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000, () => {fetch("https://buff163scraper.aisoftware.bg/scraper/start", { method: "POST"}).catch(err => console.error('\nServer start fetch: ' + err))});
}

bootstrap();

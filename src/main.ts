import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { corsConfig } from './cors.config';
import * as Sentry from "@sentry/node"
import { SentryFilter } from './sentry.filter';

require('events').EventEmitter.prototype._maxListeners = 100;

const port = 3000

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());
    app.enableCors(corsConfig);

    Sentry.init({
        dsn: process.env.SENTRY_DNS,
        tracesSampleRate: 1.0,
    })
    
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SentryFilter(httpAdapter));

    const config = new DocumentBuilder()
    .setTitle('Buff163 Scraper')
    .setDescription('A NestJS web application that scrapes CS:GO items')
    .setVersion('1.0')
    .addTag('scraper')
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(port, () => console.log("Server Started!"))
}

bootstrap();
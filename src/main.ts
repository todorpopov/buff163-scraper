import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import { join } from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  // const app = await NestFactory.create<NestExpressApplication>(
  //   AppModule,
  // );
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true
  })

  app.use(cookieParser())

  // app.useStaticAssets(join(__dirname, '..', 'src/public'));
  // app.setBaseViewsDir(join(__dirname, '..', 'src/views'));
  // app.setViewEngine('hbs');

  const config = new DocumentBuilder()
    .setTitle('Buff163 Scraper')
    .setDescription('A NestJS web application that scrapes CS:GO items')
    .setVersion('1.0')
    .addTag('scraper')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  await app.listen(process.env.PORT || 3000);
}
bootstrap();


// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(3000);
// }
// bootstrap();
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScraperModule } from './scraper/scraper.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static/dist/serve-static.module';
import { join } from 'path';

@Module({
  imports: [
    ScraperModule, 
    ScheduleModule.forRoot(), 
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src/public'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

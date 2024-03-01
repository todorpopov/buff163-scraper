import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ScraperModule } from './scraper/scraper.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueModule } from './queue/queue.module';
import { AccountingModule } from './accounting/accounting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScraperModule, 
    AuthModule, 
    UsersModule,
    ScheduleModule.forRoot(),
    QueueModule,
    AccountingModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

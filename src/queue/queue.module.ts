import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { ScraperService } from 'src/scraper/scraper.service';

@Module({
  controllers: [QueueController],
  providers: [QueueService, ScraperService],
})
export class QueueModule {}

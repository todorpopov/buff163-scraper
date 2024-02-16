import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { ScraperService } from 'src/scraper/scraper.service';

@Module({
  providers: [QueueService, ScraperService],
})
export class QueueModule {}

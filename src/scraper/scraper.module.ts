import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { QueueService } from 'src/queue/queue.service';

@Module({
  providers: [ScraperService, QueueService],
  controllers: [ScraperController],
  exports: [ScraperService]
})
export class ScraperModule {}
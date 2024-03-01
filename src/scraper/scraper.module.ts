import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { QueueService } from 'src/queue/queue.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemSchema } from 'src/schemas/item.schema';

@Module({
  // imports: [
  //   MongooseModule.forFeature([{ name: 'Item', schema: ItemSchema }])
  // ],
  providers: [ScraperService, QueueService],
  controllers: [ScraperController],
  exports: [ScraperService]
})
export class ScraperModule {}
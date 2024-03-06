import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BoughtItemSchema } from 'src/accounting/schemas/bought.item.schema';
import { ItemSchema } from 'src/scraper/schemas/item.schema';
import { SoldItemSchema } from './schemas/sold.item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'BoughtItem', schema: BoughtItemSchema }]),
    MongooseModule.forFeature([{ name: 'SoldItem', schema: SoldItemSchema }]),
    MongooseModule.forFeature([{ name: 'Item', schema: ItemSchema }])
  ],
  providers: [AccountingService],
  controllers: [AccountingController]
})
export class AccountingModule {}

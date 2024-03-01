import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountingItemSchema } from 'src/schemas/accounting.item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'AccountingItem', schema: AccountingItemSchema }])
  ],
  providers: [AccountingService],
  controllers: [AccountingController]
})
export class AccountingModule {}

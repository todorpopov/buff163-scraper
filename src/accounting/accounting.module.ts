import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';

@Module({
  providers: [AccountingService],
  controllers: [AccountingController]
})
export class AccountingModule {}

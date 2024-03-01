import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Item } from 'src/types/item';
import { AccountingService } from './accounting.service';

@Controller('accounting')
export class AccountingController {
    constructor(private readonly accountingService: AccountingService){}

    @ApiOperation({ summary: '' })
    @UseGuards(AuthGuard)
    @Get()
    getAllAccountingInformation(){ 
        return {msg: "This is the accounting page of the app!"}
    }

    @ApiOperation({ summary: '' })
    @UseGuards(AuthGuard)
    @Post("buy")
    async buyItem(@Body() item: Item){ 
        return await this.accountingService.buyItem(item)
    }

    @ApiOperation({ summary: '' })
    @UseGuards(AuthGuard)
    @Post("sell")
    sellItem(@Body() item: Item){ 
        
    }
}
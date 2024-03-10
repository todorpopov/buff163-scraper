import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Item } from 'src/types/item';
import { AccountingService } from './accounting.service';

@ApiTags('accounting')
@Controller('accounting')
export class AccountingController {
    constructor(private readonly accountingService: AccountingService){}

    @ApiOperation({ summary: 'Buy an item. Requires an item id passed in the URI. No response returned.'})
    @UseGuards(AuthGuard)
    @Post("buy/:itemId")
    async buyItem(@Param("itemId") itemId: string){ 
        return await this.accountingService.buyItem(itemId)
    }

    @ApiOperation({ summary: 'Sell an item. Requires and item id and a price passed in the URI. No response returned' })
    @UseGuards(AuthGuard)
    @Post("sell/:itemId/:sellPrice")
    async sellItem(@Param("itemId") itemId: string, @Param("sellPrice") sellPrice: string){ 
        return await this.accountingService.sellItem(itemId, Number(sellPrice))
    }

    @ApiOperation({ summary: 'Returns "Array<BoughtItem>"' })
    @UseGuards(AuthGuard)
    @Get("bought")
    async getBoughtItems(){ 
        return await this.accountingService.getAllBoughtItems()
    }

    @ApiOperation({ summary: 'Returns "Array<SoldItem>"' })
    @UseGuards(AuthGuard)
    @Get("sold")
    async getSoldItems(){ 
        return await this.accountingService.getAllSoldItems()
    }

    @ApiOperation({ summary: 'Returns a JSON with "total_investend", and "total_profit" properties' })
    @UseGuards(AuthGuard)
    @Get("stats")
    async getAccountingStats(){ 
        return await this.accountingService.getStats()
    }
}
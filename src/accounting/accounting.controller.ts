import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Item } from 'src/types/item';

@Controller('accounting')
export class AccountingController {
    
    @ApiOperation({ summary: '' })
    @UseGuards(AuthGuard)
    @Get()
    getAllAccountingInformation(){ 
        return {msg: "This is the accounting page of the app!"}
    }

    @ApiOperation({ summary: '' })
    @UseGuards(AuthGuard)
    @Post("buy")
    buyItem(@Body() item: Item){ 
        
    }

    @ApiOperation({ summary: '' })
    @UseGuards(AuthGuard)
    @Post("sell")
    sellItem(@Body() item: Item){ 
        
    }
}
import { Controller, Get, Param, Render } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { Cron } from '@nestjs/schedule';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @Get('item/:itemCode')
    async scrapeItems(@Param('itemCode') itemCode: string) {
        return this.scraperService.scrapeItemsDetails(itemCode)
    }
    
    
    @Get('stickers/:itemCode')
    async getStickers(@Param('itemCode') itemCode: string) {
        return this.scraperService.scrapeStickersPrices(itemCode)
    }
    
    @Get("all/:itemCode")
    @Render('details_template')
    async scrapeAllDetails(@Param('itemCode') itemCode: string){
        const itemsList = await this.scraperService.scrapeAllDetails(itemCode)
        return { items: itemsList }
    }
    
    //@Cron("*/5 * * * *") // Run every 5 minutes
    @Get("")
    @Render('details_template')
    async scrapeMultiplePages(){
        const itemsList = await this.scraperService.scrapeMultiplePages()
        return { items: itemsList }
    }

    @Cron("*/5 * * * *") // Run every 5 minutes
    @Get("only_with_stickers")
    @Render('details_template')
    async getOnlyItemsWithStickers(){
        const itemsList = await this.scraperService.getOnlyItemsWithStickers()
        return { items: itemsList }
    }
}

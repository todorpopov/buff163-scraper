import { Controller, Get, Param } from '@nestjs/common';
import { ScraperService } from './scraper.service';

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

    @Get("all_details/:itemCode")
    async scrapeAllDetails(@Param('itemCode') itemCode: string){
        return this.scraperService.scrapeAllDetails(itemCode)
    }
    
    @Get("")
    async scrapeMultiplePages(){
        return this.scraperService.scrapeMultiplePages()
    }
}

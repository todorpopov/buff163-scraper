import { Controller, Get, Param } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @Get('item/:itemCode')
    async scrapeLink(@Param('itemCode') itemCode: string) {
        return this.scraperService.scrapeItemDetails(itemCode)
    }

    
    @Get('stickers/:itemCode')
    async getStickers(@Param('itemCode') itemCode: string) {
        return this.scraperService.scrapeStickersPrices(itemCode)
    }

    @Get("combined/:itemCode")
    async scrapeCombine(@Param('itemCode') itemCode: string){
        return this.scraperService.combine(itemCode)
    }
    
    @Get("")
    async scrapeAll(){
        return this.scraperService.scrapeMultiple()
    }
}

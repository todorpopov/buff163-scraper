import { Controller, Get, Param } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @Get(':itemCode/:pageNum')
    async scrapeLink(@Param('itemCode') itemCode: string, @Param('pageNum') pageNum: string) {
        return this.scraperService.scraper(itemCode, pageNum)
    }

    @Get("all")
    async scrapeAll(){
        return this.scraperService.scrapeMultiple()
    }
}

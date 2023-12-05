import { Controller, Get, Param } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @Get("/asd")
    async scrape(){
        return this.scraperService.scraper("35286#page_num=1")
    }

    @Get(':link')
    async scrapeLink(@Param('link') link: string) {
        // console.log(link)
        return this.scraperService.scraper(link)
    }
}

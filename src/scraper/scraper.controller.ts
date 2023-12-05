import { Controller, Get, Param } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}


    @Get(':link')
    async scrapeLink(@Param('link') link: string) {
        // console.log(link)
        return this.scraperService.scraper(link)
    }
}

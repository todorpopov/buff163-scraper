import { Controller, Get, Param, Render, Sse, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { Observable, filter, map, of } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { stickerPriceFilter } from './external_functions';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

  @ApiTags('scraper')
  @Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @ApiOperation({ summary: 'Scrapes a page by specifying an item code' })
    @UseGuards(AuthGuard)
    @Get('item/:itemCode')
    async scrapeItems(@Param('itemCode') itemCode: string) {
        return this.scraperService.scrapeItemsDetails(itemCode)
    }
    
    @ApiOperation({ summary: 'Scrapes the stickers prices on a page by specifying an item code' })
    @UseGuards(AuthGuard)
    @Get('stickers/:itemCode')
    async getStickers(@Param('itemCode') itemCode: string) {
        return this.scraperService.scrapeStickersPrices(itemCode)
    }
    
    @ApiOperation({ summary: 'Scrapes the items details and stickers prices and combines the results' })
    @UseGuards(AuthGuard)
    @Get("all/:itemCode")
    @Render('details_template')
    async scrapeAllDetails(@Param('itemCode') itemCode: string){
        const itemsList = await this.scraperService.scrapeAllDetails(itemCode)
        return { items: itemsList }
    }
    
    @ApiOperation({ summary: 'Scrapes item details and stickers prices of multiple, random item codes' })
    @UseGuards(AuthGuard)
    @Get("")
    @Render('details_template')
    async scrapeMultiplePages(){
        const itemsList = await this.scraperService.scrapeMultiplePages()
        return { items: itemsList }
    }

    @ApiOperation({ summary: 'Scrapes multiple random item codes and returns only the ones with stickers' })
    //@UseGuards(AuthGuard)
    @Get("only_with_stickers")
    @Render('details_template')
    async getOnlyItemsWithStickers(){
        const itemsList = await this.scraperService.getOnlyItemsWithStickers()
        return { items: itemsList }
    }

    @ApiOperation({ summary: 'An observable SSE stream that consists of only items with stickers that meet certain criteria. Gets populated with data over time, as the cron restarts the scraper every 5 min' })
    // @UseGuards(AuthGuard)
    @Sse("stream")
    getDataSse(): Observable<any>{
        return this.scraperService.itemsSubject.pipe(filter(item => stickerPriceFilter(item['data'], 50)))
    }
}

import { Controller, Get, Param, Render, Sse, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { Observable, filter, map, of } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { stickerPriceFilter } from './external_functions';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @UseGuards(AuthGuard)
    @Get('item/:itemCode')
    async scrapeItems(@Param('itemCode') itemCode: string) {
        return this.scraperService.scrapeItemsDetails(itemCode)
    }
    
    @UseGuards(AuthGuard)
    @Get('stickers/:itemCode')
    async getStickers(@Param('itemCode') itemCode: string) {
        return this.scraperService.scrapeStickersPrices(itemCode)
    }
    
    @UseGuards(AuthGuard)
    @Get("all/:itemCode")
    @Render('details_template')
    async scrapeAllDetails(@Param('itemCode') itemCode: string){
        const itemsList = await this.scraperService.scrapeAllDetails(itemCode)
        return { items: itemsList }
    }
    
    @UseGuards(AuthGuard)
    @Get("")
    @Render('details_template')
    async scrapeMultiplePages(){
        const itemsList = await this.scraperService.scrapeMultiplePages()
        return { items: itemsList }
    }

    //@UseGuards(AuthGuard)
    @Get("only_with_stickers")
    @Render('details_template')
    async getOnlyItemsWithStickers(){
        const itemsList = await this.scraperService.getOnlyItemsWithStickers()
        return { items: itemsList }
    }

    // @UseGuards(AuthGuard)
    @Sse("stream")
    getDataSse(): Observable<any>{
        return this.scraperService.itemsSubject.pipe(filter(item => stickerPriceFilter(item['data'], 50)))
    }
}

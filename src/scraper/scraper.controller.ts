import { Controller, Get, Param, Sse, UseGuards, Body } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { Observable, filter } from 'rxjs';
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
    async scrapeAllDetails(@Param('itemCode') itemCode: string){
        const itemsList = await this.scraperService.scrapeAllDetails(itemCode)
        return { items: itemsList }
    }
    
    @ApiOperation({ summary: 'Scrapes item details and stickers prices of multiple, random item codes' })
    @UseGuards(AuthGuard)
    @Get("")
    async scrapeMultiplePages(){
        const itemsList = await this.scraperService.scrapeMultiplePages()
        return { items: itemsList }
    }

    @ApiOperation({ summary: 'Scrapes multiple random item codes and returns only the ones with stickers' })
    @UseGuards(AuthGuard)
    @Get("only_with_stickers")
    async getOnlyItemsWithStickers(){
        const itemsList = await this.scraperService.getOnlyItemsWithStickers()
        return { items: itemsList }
    }

    @ApiOperation({ summary: 'An observable SSE stream that consists of only items with stickers that meet certain criteria. Gets populated with data over time, as the cron restarts the scraper every 5 min' })
    @UseGuards(AuthGuard)
    @Sse("stream/filter=:filter")
    getDataSse(@Param('filter') stickerFilter: string): Observable<any>{
        if(!stickerFilter.match("[1-9][0-9]*")){
            return this.scraperService.itemsSubject
        }else {
            return this.scraperService.itemsSubject.pipe(filter(item => stickerPriceFilter(item['data'], Number(stickerFilter))))
        }
    }
    @ApiOperation({ summary: 'Returns the same items as the observable stream, but in a single request, instead of an SSE stream' })
    @UseGuards(AuthGuard)
    @Get("static/filter=:filter")
    getDataStatic(@Param('filter') stickerFilter: string){
        if(!stickerFilter.match("[1-9][0-9]*")){
            return this.scraperService.itemsArray
        }else{
            return this.scraperService.itemsArray.filter((item) => stickerPriceFilter(item, Number(stickerFilter)))
        }
    }

    @ApiOperation({ summary: 'Clears all data from the observable and the array' })
    @UseGuards(AuthGuard)
    @Get("clear")
    clearObservable(){
        this.scraperService.clearItems()
        return { msg: "Items successfully cleared!" }
    }

    @ApiOperation({ summary: 'Checks the availability of a single item. Link is passed in the body' })
    @UseGuards(AuthGuard)
    @Get("is_available")
    async checkAvailability(@Body() data: Record<string, any>){
        return await this.scraperService.checkItemAvailability(data.link)
    }

    @ApiOperation({ summary: 'Checks item availability' })
    @UseGuards(AuthGuard)
    @Get("all_available")
    async availability(){
        return await this.scraperService.generalAvailability()
    }

    @ApiOperation({ summary: "Get server state statistics" })
    @UseGuards(AuthGuard)
    @Get("stats")
    stats(){
        const itemsNum = this.scraperService.itemsArray.length
        return { number_of_items: itemsNum }
    }
}
import { Controller, Get, Next, Param, Render, Sse } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { Cron } from '@nestjs/schedule';
import { Observable, interval, map } from 'rxjs';
import { subscribe } from 'diagnostics_channel';

interface Data {
    data: any[]
}

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
    
    @Get("")
    @Render('details_template')
    async scrapeMultiplePages(){
        const itemsList = await this.scraperService.scrapeMultiplePages()
        return { items: itemsList }
    }

    @Get("only_with_stickers")
    @Render('details_template')
    async getOnlyItemsWithStickers(){
        const itemsList = await this.scraperService.getOnlyItemsWithStickers()
        return { items: itemsList }
    }

    // @Cron("*/5 * * * *")
    @Cron("*/30 * * * * *")
    @Sse("server_sent")
    async getDataSse(): Promise<Observable<any>>{
        // const items = this.scraperService.getDataSse()
        // return items
        const data = await this.scraperService.getDataSse().then(obs => {
            obs.subscribe()
            return obs
        })
        return data
    }
}

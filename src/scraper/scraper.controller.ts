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

    @ApiOperation({ summary: 'Scrapes a random item page' })
    // @UseGuards(AuthGuard)
    @Get('random_item')
    async scrapeItems() {
        return await this.scraperService.scrapeRandomPage()
    }

    @ApiOperation({ summary: 'An observable SSE stream for storing the scraped items' })
    // @UseGuards(AuthGuard)
    @Sse("stream/filter=:filter")
    getDataSse(@Param('filter') stickerFilter: string): Observable<any>{
        if(!stickerFilter.match("[1-9][0-9]*")){
            return this.scraperService.itemsSubject
        }else {
            return this.scraperService.itemsSubject.pipe(filter(item => stickerPriceFilter(item['data'], Number(stickerFilter))))
        }
    }
    @ApiOperation({ summary: 'Returns an array storing all scraped items' })
    // @UseGuards(AuthGuard)
    @Get("static/filter=:filter")
    getDataStatic(@Param('filter') stickerFilter: string){
        if(!stickerFilter.match("[1-9][0-9]*")){
            return this.scraperService.itemsArray
        }else{
            return this.scraperService.itemsArray.filter((item) => stickerPriceFilter(item, Number(stickerFilter)))
        }
    }

    @ApiOperation({ summary: 'Clears all data from the observable and the array' })
    // @UseGuards(AuthGuard)
    @Get("clear")
    clearObservable(){
        this.scraperService.clearItems()
        return { msg: "Items successfully cleared!" }
    }

    @ApiOperation({ summary: "Get server stats" })
    // @UseGuards(AuthGuard)
    @Sse("stats")
    stats(){
        return this.scraperService.statsObs
    }

    @Get("start_queue/:items")
    queue(@Param('items') items: string){
        this.scraperService.queue(Number(items))
        return { msg: "Queue has been started!" }
    }
}
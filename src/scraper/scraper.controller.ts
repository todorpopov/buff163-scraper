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
    // @UseGuards(AuthGuard)
    @Get('random_item')
    async scrapeItems() {
        const result = await this.scraperService.scrapeRandomPage()
        return result
    }

    @ApiOperation({ summary: 'An observable SSE stream that consists of only items with stickers that meet certain criteria. Gets populated with data over time, as the cron restarts the scraper every 5 min' })
    // @UseGuards(AuthGuard)
    @Sse("stream/filter=:filter")
    getDataSse(@Param('filter') stickerFilter: string): Observable<any>{
        if(!stickerFilter.match("[1-9][0-9]*")){
            return this.scraperService.itemsSubject
        }else {
            return this.scraperService.itemsSubject.pipe(filter(item => stickerPriceFilter(item['data'], Number(stickerFilter))))
        }
    }
    @ApiOperation({ summary: 'Returns the same items as the observable stream, but in a single request, instead of an SSE stream' })
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
}
import { Controller, Get, Param, Sse, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { filter } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { stickerPriceFilter } from './external_functions';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('scraper')
@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @ApiOperation({ summary: 'An observable SSE stream for storing the scraped items' })
    // @UseGuards(AuthGuard)
    @Sse("stream/filter=:filter")
    getDataSse(@Param('filter') stickerFilter: string){
        if(!stickerFilter.match("[1-9][0-9]*")){
            return this.scraperService.itemsSubject
        }else {
            return this.scraperService.itemsSubject.pipe(filter(item => stickerPriceFilter(item['data'], Number(stickerFilter))))
        }
    }
    
    @ApiOperation({ summary: "Return an array of the cached stickers" })
    // @UseGuards(AuthGuard)
    @Get("fetch_stickers")
    async cachedStickers(){
        await this.scraperService.fetchStickerPrices()
        return {msg: "Successfully fetched current sticker prices!"} 
    }

    @ApiOperation({ summary: "Start a queue of length 'items'. 'delay' is used to prevent 429 requests" })
    // @UseGuards(AuthGuard)
    @Get("start_queue/:items/:delay")
    queue(@Param('items') items: string, @Param('delay') delay: string){
        this.scraperService.queue(Number(items), Number(delay))
        return { msg: `Queue (length ${items}) has been started!` }
    }

    @ApiOperation({ summary: "Starts 'num' number of queues of length 'len'" })
    // @UseGuards(AuthGuard)
    @Get("start_queues/:num/:len")
    multipleQueues(@Param('num') num: string, @Param('len') len: string){
        this.scraperService.startMultipleQueues(Number(num), Number(len))
        return { msg: `${num} queues of length ${len} have been started!` }
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
    @Get("stats")
    stats(){
        return this.scraperService.statsArray
    }
}
import { Body, Controller, Get, Param, Post, Sse, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { filter } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { stickerPriceFilter, proxies } from './external_functions';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueueService } from 'src/queue/queue.service';

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

    @ApiOperation({ summary: "Starts a queue of all items saved in the 'items.txt' file" })
    // @UseGuards(AuthGuard)
    @Get('queue')
    queue(){
        const queue = new QueueService()

        const chunkSize = proxies.length
        const array = queue.divideQueue(chunkSize)

        if(array.length !== chunkSize){return { msg: "An error occured!"}}

        for(let i = 0; i < chunkSize; i++){
            this.scraperService.scrapeArray(array[i], proxies[i])
        }

        return {msg: "Queue started successfully!"}
    }

    @Post('options/update')
    updateOptions(@Body() newOtions){
        this.scraperService.updateOptions(newOtions)
        return { msg: "Options updated successfully!"}
    }

    @Post('options/reset')
    resetOptions(){
        this.scraperService.updateOptions({
            reference_price_percentage: 150,
            item_min_price: 0,
            item_max_price: 1000000,
            min_memory: 10
        })
        return { msg: "Options reset successfully!"}
    }

    @ApiOperation({ summary: 'Clears all data from the observable and the array' })
    // @UseGuards(AuthGuard)
    @Get("clear")
    clearObservable(){
        this.scraperService.clearItems()
        return { msg: "Items cleared successfully!" }
    }
    
    @ApiOperation({ summary: "Get server stats" })
    // @UseGuards(AuthGuard)
    @Get("stats")
    stats(){
        return this.scraperService.stats
    }

    @Get("error_codes")
    getErrorCodes(){
        return this.scraperService.errorItemCodes
    }
}
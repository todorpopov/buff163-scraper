import { Body, Controller, Get, Param, Post, Sse, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { distinct, filter } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { stickerPriceFilter, uniqueErrors } from './external_functions';
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
            .pipe(distinct())
        }else {
            return this.scraperService.itemsSubject
            .pipe((filter(item => stickerPriceFilter(item['data'], Number(stickerFilter)))))
            .pipe(distinct())
        }
    }
    
    @ApiOperation({ summary: "Fetches an array of the cached stickers" })
    // @UseGuards(AuthGuard)
    @Get("fetch_stickers")
    async cachedStickers(){
        await this.scraperService.fetchStickerPrices()
        return {msg: "Successfully fetched current sticker prices!"} 
    }

    @ApiOperation({ summary: "Starts an infinite scraping process" })
    // @UseGuards(AuthGuard)
    @Get('start')
    async start(){
        while(true){
            await this.scraperService.startQueue()
        }
    }

    @ApiOperation({ summary: 'Updates the server options (requires a JSON in the body param)' })
    // @UseGuards(AuthGuard)
    @Post('options/update')
    updateOptions(@Body() newOtions){
        this.scraperService.updateOptions(newOtions)
        return { msg: "Options updated successfully!"}
    }

    @ApiOperation({ summary: 'Resets all server options to their defaults' })
    // @UseGuards(AuthGuard)
    @Post('options/reset')
    resetOptions(){
        this.scraperService.updateOptions({
            reference_price_percentage: -1,
            item_min_price: 0,
            item_max_price: 1000000,
            min_memory: 10,
            sleep_ms: 0
        }
    )
        return { msg: "Options reset successfully!"}
    }

    @ApiOperation({ summary: 'Clears all saved data' })
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

    @ApiOperation({ summary: "Returns an array of all item codes that returned errors during scraping" })
    @Get("error_codes")
    // @UseGuards(AuthGuard)
    getErrorCodes(){
        return uniqueErrors(this.scraperService.errorItemCodes)
    }
}
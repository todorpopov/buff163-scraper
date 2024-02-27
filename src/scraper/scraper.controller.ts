import { Body, Controller, Get, OnModuleInit, Param, Post, Sse, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { filter } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { stickerPriceFilter } from '../other/scraper';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Options } from 'src/types/options';

@ApiTags('scraper')
@Controller('scraper')
export class ScraperController implements OnModuleInit {
    async onModuleInit() {
        this.start()
    }

    stopScraping: boolean // A variable to manage the scraping process through endpoints
    constructor(private readonly scraperService: ScraperService) {
        this.stopScraping = false
    }

    @ApiOperation({ summary: 'An observable SSE stream for storing the scraped items' })
    // @UseGuards(AuthGuard)
    @Sse("stream/filter=:filter")
    getDataSse(@Param('filter') stickerFilter: string){ 
        if(!stickerFilter.match("[1-9][0-9]*")){
            return this.scraperService.itemsSubject
        }else {
            return this.scraperService.itemsSubject
            .pipe((filter(item => stickerPriceFilter(item['data'], Number(stickerFilter)))))
        }
    }

    @ApiOperation({ summary: "Starts an infinite scraping process!" })
    @UseGuards(AuthGuard)
    @Post("start")
    async start(){
        this.stopScraping = false
        console.log("\nScraping process has been started")
        while(true){
            if(this.stopScraping){ // Stop the scraping when "stopScraping" is set to "true"
                break
            }
            await this.scraperService.startQueue()
        }
    }

    @ApiOperation({ summary: "Stops the infinite scraping process!" })
    @UseGuards(AuthGuard)
    @Post("stop")
    stop(){
        this.stopScraping = true
        console.log(`\nScraping process has been stopped:\n\tstopScraping: ${this.stopScraping}`)
        return { msg: "Scraping has been stoped sucessfully!" }
    }

    @ApiOperation({ summary: "Get current status of the scraping process" })
    @UseGuards(AuthGuard)
    @Get("status")
    getScrapingStatus(){
        if(this.stopScraping){
            return { msg: "Scraping process has been turned off and will stop after the current queue has been complete!" }
        }else{
            return { msg: "Scraping process is running" }
        }
    }

    @ApiOperation({ summary: 'Updates the server options (requires a JSON in the body param)' })
    @UseGuards(AuthGuard)
    @Post("options/update")
    updateOptions(@Body() newOptions: Options){
        this.scraperService.updateOptions(newOptions)
        return { msg: "Options updated successfully!"}
    }

    @ApiOperation({ summary: 'Resets all server options to their defaults' })
    @UseGuards(AuthGuard)
    @Post("options/reset")
    resetOptions(){
        this.scraperService.updateOptions({
            max_reference_price_percentage: -1,
            item_min_price: 0,
            item_max_price: 1000000,
            min_memory: 8,
            sleep_ms: 0
        })

        return { msg: "Options reset successfully!"}
    }

    @ApiOperation({ summary: 'Clears all saved data' })
    @UseGuards(AuthGuard)
    @Get("clear")
    clearObservable(){
        this.scraperService.clearItems()
        return { msg: "Items cleared successfully!" }
    }
    
    @ApiOperation({ summary: "Get server stats" })
    // @UseGuards(AuthGuard)
    @Get("stats")
    stats(){
        return this.scraperService.serverStats
    }
}
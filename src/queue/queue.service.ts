import { Injectable } from '@nestjs/common';
import { parseFile } from 'src/scraper/external_functions';
import { ScraperService } from 'src/scraper/scraper.service';

@Injectable()
export class QueueService {
    constructor(private readonly scraperService: ScraperService) {}
    itemFileContent = parseFile('./src/files/ids.txt')

    async queue(proxy: string){
        const start = performance.now()
    
        console.log(`\nNew queue started!\nProxy: ${proxy}`)
    
        for(const item of this.itemFileContent){
            console.log(item)
            await this.scraperService.scrapePage(item, proxy)
        }
    
        const end = performance.now()
        console.log(`\nTime to iterate over queue: ${((end - start) / 1000).toFixed(2)} s`)
    }
}

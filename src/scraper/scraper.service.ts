import { Injectable } from '@nestjs/common';
import { getRandomItem, checkStickerCache, parseFile, sleep } from './external_functions';
import { ReplaySubject } from 'rxjs';
const os = require('os')

@Injectable()
export class ScraperService {
    async scrapeRandomPage(){
        const start = performance.now()

        if(this.fileContent.length === 0){
            this.getFileContent()
        }

        if(this.stickerCache.length === 0){
            await this.fetchStickerPrices()
        }

        this.numberOfPages++

        const randomItem = getRandomItem(this.fileContent)
        const itemLink = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${randomItem.code}&page_num=1`

        let pageData: any = await fetch(itemLink, {method: 'GET'}).then(res => res.text()).catch(err => console.error('error - 1: ' + err));
        if(pageData[0] !== "{"){
            console.log(pageData)
            this.errors++
            return
        }else{
            pageData = JSON.parse(pageData)
        }
        
        let itemsArray: any[]
        try{
            itemsArray = pageData.data.items
        }catch(err){
            console.log(err)
            return
        }

        itemsArray.forEach(item => {
            const itemStickers = item.asset_info.info.stickers
            if(itemStickers.length === 0){return}
            
            itemStickers.forEach(async(sticker) => {
                delete sticker.img_url
                delete sticker.category
                delete sticker.sticker_id
                sticker.price = checkStickerCache(this.stickerCache, `Sticker | ${sticker.name}`)
            })


            let itemName = randomItem.name
            if(itemName.includes('StatTrak')){
                itemName = itemName.slice(10)
            }

            const newItemObject = {
                id: item.asset_info.assetid,
                name: itemName,
                price: Number(item.price),
                number_of_stickers: itemStickers.length,
                stickers: itemStickers,
                item_offer_url: `https://buff.163.com/shop/${item.user_id}#tab=selling&game=csgo&page_num=1&search=${itemName.replaceAll(' ', '%20')}`,
                paintwear: item.asset_info.paintwear
            }

            this.asignItem(newItemObject)
        })

        const end = performance.now()
        this.scrapingTime.push((end - start))
    }
    
    fileContent = []
    getFileContent(){
        this.fileContent = parseFile()
        console.log("File content has been parsed!")
    }

    stickerCache = []
    async fetchStickerPrices(){
        const stickerURI = "https://stickers-server-adjsr.ondigitalocean.app/array"
        this.stickerCache = await fetch(stickerURI, {method: 'GET'}).then(res => res.json()).catch(err => console.error('error - stickers fetch: ' + err))
        console.log("Fetched latest stickers!")
    }


    async queue(len: number, delay: number){
        const start = performance.now()
        console.log(`New queue (${len} items), and sleep (${delay}) has been started!`)

        for(let i = 0; i < len; i++){
            await this.scrapeRandomPage()
            await sleep(delay)
            if(i % 10 === 0){
                this.getStats()
            }
        }
        const end = performance.now()
        console.log(`Time to iterate over ${len} items: ${(end - start).toFixed(2)} ms`)
    }

    startMultipleQueues(num: number, len: number){
        for(let i = 0; i < num; i++){
            this.queue(len, 1000)
        }
    }


    itemsSubject = new ReplaySubject()
    itemsNum = 0

    scrapingTime = []
    errors = 0
    numberOfPages = 0

    asignItem(item: any): void {
        this.itemsSubject.next({data: item})
        this.itemsNum++
    }
    
    clearItems(): void {
        this.itemsSubject.complete()
        this.itemsSubject = new ReplaySubject()

        this.itemsNum = 0

        this.statsArray = []

        this.scrapingTime = []
        this.errors = 0
        this.numberOfPages = 0

        console.log(`\nItems and Logs cleared on: ${new Date()}\n`)
    }


    statsArray = []
    getStats(){
        const freeMemory = Math.round(os.freemem() / 1024 / 1024)
        const totalMemory = Math.round(os.totalmem() / 1024 / 1024)
        const memoryPercetage = (freeMemory / totalMemory) * 100

        if(memoryPercetage < 10){
            this.clearItems()
        }

        const stats = { 
            number_of_items: this.itemsNum,
            pages_scraped: this.numberOfPages,
            average_scrape_time_ms: (this.scrapingTime.reduce((a, b) => a + b, 0) / this.scrapingTime.length).toFixed(2),
            errors: this.errors,
            free_memory: freeMemory,
            free_memory_percentage: memoryPercetage,
            total_memory: totalMemory
        }

        this.statsArray.push(stats)
    }
}
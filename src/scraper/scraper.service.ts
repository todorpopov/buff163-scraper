import { Injectable } from '@nestjs/common'
import { checkStickerCache, comparePrices, proxies, sleep } from './external_functions'
import { ReplaySubject } from 'rxjs'
import { Cron } from '@nestjs/schedule'
import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { QueueService } from 'src/queue/queue.service'
const os = require('os')

@Injectable()
export class ScraperService {
    options = {
        reference_price_percentage: -1,
        item_min_price: 0,
        item_max_price: 1000000,
        min_memory: 8,
        sleep_ms: 0,
    }

    updateOptions(newOptions: any){
        this.options = newOptions
    }

    async scrapePage(itemObject: any, proxy: string){
        const start = performance.now()

        if(this.stickerCache.length === 0){
            await this.fetchStickerPrices()
        }

        this.numberOfPages++
        
        const itemLink = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${itemObject.code}&page_num=1`
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`)

        const options = {
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "bg-BG,bg;q=0.9,en;q=0.8",
                "sec-ch-ua": "\"Not A(Brand\";v=\"99\", \"Google Chrome\";v=\"121\", \"Chromium\";v=\"121\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest"
            },
            referrer: "https://buff.163.com/goods/35286",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "include",
            agent: proxyAgent
        }

        let pageData: any = await fetch(itemLink, options).then(res => res.text()).catch(error => {
            this.errors++
            this.errorItemCodes.push(itemObject.code)
            console.error("\n" + error)
        })
        
        let itemsArray: any[]
        let itemReferencePrice: number
        let itemImgURL: string
        try{
            pageData = JSON.parse(pageData)
            itemsArray = pageData.data.items
            itemReferencePrice = Number(pageData.data.goods_infos[`${itemObject.code}`].steam_price_cny)
            itemImgURL = pageData.data.goods_infos[`${itemObject.code}`].icon_url
        }catch(error){
            console.log("\n" + itemObject.code + ': ' + error)
            this.errors++
            this.errorItemCodes.push(itemObject.code)
            return
        }


        itemsArray.forEach(item => {
            const itemPrice = Number(item.price)

            if(itemPrice < this.options.item_min_price || itemPrice > this.options.item_max_price){return}

            const priceDifferenceStatement = comparePrices(this.options.reference_price_percentage, itemReferencePrice, itemPrice)
            if(priceDifferenceStatement !== true){return}

            const itemStickers = item.asset_info.info.stickers
            if(itemStickers.length === 0){return}
            
            itemStickers.forEach(async(sticker) => {
                delete sticker.category
                delete sticker.sticker_id
                sticker.price = checkStickerCache(this.stickerCache, sticker.name)
            })


            let itemName = itemObject.item_name
            if(itemName.includes('StatTrak')){
                itemName = itemName.slice(10)
            }

            const newItemObject = {
                id: item.asset_info.assetid,
                img_url: itemImgURL,
                name: itemName,
                price: itemPrice,
                reference_price: itemReferencePrice,
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
    
    async scrapeArray(array: any[], proxy: string){
        for(const item of array){
            await this.scrapePage(item, proxy)
            await sleep(this.options.sleep_ms)
        }
    }

    stickerCache = []
    async fetchStickerPrices(){
        const stickerURI = "https://stickers-server-adjsr.ondigitalocean.app/array"
        this.stickerCache = await fetch(stickerURI, {method: 'GET'}).then(res => res.json()).catch(err => console.error('\nerror - stickers fetch: ' + err))
        console.log("\nFetched latest stickers!")
    }

    async startQueue(){
        if(this.stickerCache.length === 0){
            await this.fetchStickerPrices()
        }

        const queue = new QueueService()

        const chunkSize = proxies.length
        const array = queue.divideQueue(chunkSize)

        if(array.length !== chunkSize){return { msg: "An error occured!"}}

        
        let promises = []
        for(let i = 0; i < chunkSize; i++){
            promises.push(this.scrapeArray(array[i], proxies[i]))
        }
        
        console.log("\nQueue has been started!")
        await Promise.all(promises)
    }

    itemsSubject = new ReplaySubject()
    itemsNum = 0
    
    scrapingTime = []
    errors = 0
    errorItemCodes = []
    numberOfPages = 0

    asignItem(item: any): void {
        this.itemsSubject.next({data: item})
        this.itemsNum++
    }
    
    @Cron("0 0 * * *")
    clearItems(): void {
        this.itemsSubject.complete()
        this.itemsSubject = new ReplaySubject()

        this.itemsNum = 0

        this.stats = {}

        this.scrapingTime = []
        this.errors = 0
        this.errorItemCodes = []
        this.numberOfPages = 0

        console.log(`\nItems and Logs have been cleared!`)
    }

    stats = {}
    @Cron("*/1 * * * * *")
    getStats(){
        const freeMemory = Math.round(os.freemem() / 1024 / 1024)
        const totalMemory = Math.round(os.totalmem() / 1024 / 1024)
        const memoryPercetage = (freeMemory / totalMemory) * 100

        if(memoryPercetage < this.options.min_memory){
            this.clearItems()
        }

        const stats = {
            date: new Date().toString(),
            number_of_items: this.itemsNum,
            pages_scraped: this.numberOfPages,
            average_scrape_time_ms: (this.scrapingTime.reduce((a, b) => a + b, 0) / this.scrapingTime.length).toFixed(2),
            errors: this.errors,
            free_memory: freeMemory,
            free_memory_percentage: memoryPercetage,
            total_memory: totalMemory,
            options: this.options
        }

        this.stats = stats
    }
}
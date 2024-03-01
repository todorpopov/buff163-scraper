import { Injectable } from '@nestjs/common'
import { getItemURL,getFetchOptions, isSaved, getItems, parseItemName } from '../other/scraper'
import { sleepMs } from '../other/general'
import { ReplaySubject } from 'rxjs'
import { Cron } from '@nestjs/schedule'
import fetch from 'node-fetch'
import { QueueService } from 'src/queue/queue.service'
import { Item } from 'src/types/item'
import { ObservableItem } from 'src/types/item.observable'
import { Options } from 'src/types/options'
import { CachedSticker } from 'src/types/sticker.cache'
import { Error } from 'src/types/error'
import { ServerStatistics } from 'src/types/statistics'
import { HttpsProxyAgent } from 'https-proxy-agent'
const os = require('os')

@Injectable()
export class ScraperService {
    options: Options
    stickersCache: Array<CachedSticker>
    itemsSubject: ReplaySubject<ObservableItem>
    numberOfItems: number
    scrapingTimesArray: Array<number>
    errors: Error
    numberOfPages: number
    serverStats: ServerStatistics
    
    constructor(){
        this.options = {
            min_memory: 8, // Remaining memory percentage, at which all items get cleared
            sleep_ms: 0, // Timeout after each scraped page
        }
        this.errors = {
            total_errors: 0,
            property_undefined_errors: 0,
            request_errors: 0,
            too_many_reqests: 0,
        }
        this.stickersCache = []
        this.itemsSubject = new ReplaySubject<ObservableItem>()
        this.numberOfItems = 0
        this.scrapingTimesArray = []
        this.numberOfPages = 0
    }

    async scrapePage(itemCode: string, proxy: string){
        const start = performance.now()
        this.numberOfPages++

        const itemURL = getItemURL(itemCode)
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`)
        const fetchOptions = getFetchOptions(proxyAgent)

        let pageData = await fetch(itemURL, fetchOptions).then(res => {
            if(res.status !== 200){
                this.errors.too_many_reqests++
                console.log(`\nHTML found in the response!\nStatus code: ${res.status}`)
            }
            return res.text()
        }).catch(error => {
            this.errors.request_errors++
            console.error(`\n${itemCode}: ${error}`)
        })

        try{
            pageData = JSON.parse(pageData)
        }catch(error){
            // this.errors.too_many_reqests++
            // console.log(`\n${itemCode}: Couldn't parse the response to JSON!`)
            return
        }
        
        const itemReferencePrice = pageData?.data?.goods_infos[`${itemCode}`]?.steam_price_cny
        if(!itemReferencePrice){
            this.errors.property_undefined_errors++
            console.log(`\n${itemCode}: Reference price was not defined!`)
            return
        }

        const itemName = pageData?.data?.goods_infos[`${itemCode}`]?.name
        if(!itemName){
            this.errors.property_undefined_errors++
            console.log(`\n${itemCode}: Item name was not defined!`)
            return
        }
        
        const itemImgURL = pageData?.data?.goods_infos[`${itemCode}`]?.icon_url
        const itemsData = pageData?.data?.items

        const itemsWithStickers = itemsData.filter(item => {
            return item?.asset_info?.info.stickers?.length !== 0
        })

        const commonProperties = {
            with_stickers: itemsWithStickers,
            stickers_cache: this.stickersCache,
            item_img_url: itemImgURL,
            item_name: parseItemName(itemName),
            item_ref_price: itemReferencePrice, 
        }

        const getEditeditems = getItems(commonProperties)

        getEditeditems.forEach(item => {
            this.appendItem(item)
        })

        const end = performance.now()
        this.scrapingTimesArray.push((end - start))
    }
    
    async scrapeArrayOfItemCodes(itemCodes: Array<string>, proxy: string){
        for(const itemCode of itemCodes){
            await this.scrapePage(itemCode, proxy)
            await sleepMs(this.options.sleep_ms)
        }
    }

    async startQueue(){
        if(this.stickersCache.length === 0){
            await this.fetchStickersCache()
        }

        const queue = new QueueService()
        const proxies = queue.proxies
        const multipleQueues = queue.multipleQueues
        
        console.log("\nQueue has been started!")
        await Promise.all(proxies.map((proxy, i) => this.scrapeArrayOfItemCodes(multipleQueues[i], proxy)))
    }

    //@Cron("0 0 * * *")
    async fetchStickersCache(){
        const stickersCacheURL = `https://${process.env.STICKERS_CACHE_URL}/array`
        this.stickersCache = await fetch(stickersCacheURL, {method: 'GET'})
        .then(res => res.json())
        .catch(error => {
            this.errors.request_errors++
            console.error(`\nError during stickers fetch: ${error}`)
        })
        console.log("\nFetched latest stickers!")
    }

    appendItem(item: Item) {
        if(!isSaved(this.itemsSubject, item.id)){
            this.itemsSubject.next({ data: item })
            this.numberOfItems++
        }
    }

    updateOptions(newOptions: Options){
        this.options = newOptions
    }
    
    clearItems() { // Clear all items from the Subject, all logs, and all errors
        this.itemsSubject.complete()
        this.itemsSubject = new ReplaySubject<ObservableItem>()
        this.numberOfItems = 0
        this.serverStats
        this.scrapingTimesArray = []
        this.errors = {
            total_errors: 0,
            property_undefined_errors: 0,
            request_errors: 0,
            too_many_reqests: 0,
        }
        this.numberOfPages = 0

        console.log(`\nItems and Logs have been cleared!`)
    }

    @Cron("*/1 * * * * *")
    getserverStats(){
        // Get the free memory of the system
        const freeMemory = Math.round(os.freemem() / 1024 / 1024) 
        
        // Get the total memory of the system 
        const totalMemory = Math.round(os.totalmem() / 1024 / 1024)

        // Calculate the free memory percentage of the system
        const memoryPercetage = (freeMemory / totalMemory) * 100 

        // Get average scraping time from the array
        const averageScrapingTime = (this.scrapingTimesArray.reduce((a, b) => a + b, 0) / this.scrapingTimesArray.length).toFixed(2)
        
        const sumOfErrors = this.errors.property_undefined_errors + this.errors.request_errors + this.errors.too_many_reqests
        const errors = {
            total_errors: sumOfErrors,
            property_undefined_errors: this.errors.property_undefined_errors,
            request_errors: this.errors.request_errors,
            too_many_reqests: this.errors.too_many_reqests,
        }

        // Clear all items when the free memory percentage falls under the options threshold
        if(memoryPercetage < this.options.min_memory){ 
            this.clearItems() 
        }

        const serverStats = {
            date: new Date().toString(),
            number_of_items: this.numberOfItems,
            pages_scraped: this.numberOfPages,
            average_scrape_time_ms: averageScrapingTime,
            errors: errors,
            free_memory: freeMemory,
            free_memory_percentage: memoryPercetage,
            total_memory: totalMemory,
            options: this.options
        }

        this.serverStats = serverStats
    }
}
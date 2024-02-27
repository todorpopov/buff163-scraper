import { Injectable, OnModuleInit } from '@nestjs/common'
import { 
    editItemStickers, getItemOfferURL, 
    getItemURL, getFetchOptions, isSaved, 
    parseItemName, isItemEligible 
} from '../other/scraper'
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
import { ResponseItem } from 'src/types/item.response'
import { HttpsProxyAgent } from 'https-proxy-agent'
const os = require('os')

@Injectable()
export class ScraperService implements OnModuleInit {
    async onModuleInit() {
        await this.fetchStickersCache()
    }

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
            max_reference_price_percentage: -1, // Default is "-1", meaning all items pass
            item_min_price: 0,
            item_max_price: 1_000_000,
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

        let pageData = await fetch(itemURL, fetchOptions).then(res => res.text()).catch(error => {
            this.errors.request_errors++
            console.error(`\n${itemCode}: ${error}`)
        })
        
        try{ // HTML handling (429 responses or proxies not working)
            pageData = JSON.parse(pageData)
        }catch(error){
            this.errors.too_many_reqests++
            console.error(`\n${itemCode}: ${error}`)
            return
        }
        
        let itemReferencePrice: number
        try{ // Get the reference price of the item
            itemReferencePrice = Number(pageData.data.goods_infos[`${itemCode}`].steam_price_cny)
        }catch(error){
            this.errors.property_undefined_errors++
            itemReferencePrice = 0
            console.error(`\n${itemCode}: ${error}`)
        }
        
        let itemName: string
        try{ // Get the name of the item
            itemName = parseItemName(pageData.data.goods_infos[`${itemCode}`].name)            
        }catch(error){
            this.errors.property_undefined_errors++
            return
        }
        
        let itemImgURL: string
        try{ // Get the item image URL
            itemImgURL = pageData.data.goods_infos[`${itemCode}`].icon_url
        }catch(error){
            this.errors.property_undefined_errors++
            console.error(`\n${itemCode}: ${error}`)
            return
        }

        let itemsArray: Array<ResponseItem>
        try{ // Get the item array
            itemsArray = pageData.data.items
        }catch(error){
            this.errors.property_undefined_errors++
            console.error(`\n${itemCode}: ${error}`)
            return
        }

        const eligibleItems = itemsArray.filter(item=>{
            const itemPrice = Number(item.price)

            let itemStickers = item.asset_info.info.stickers
            const numberOfStickers = itemStickers.length

            const itemPropertiesToCheck = {
                stickers_num: numberOfStickers, 
                min_price: this.options.item_min_price,
                max_price: this.options.item_max_price,
                item_price: itemPrice, 
                ref_price: itemReferencePrice,
                max_ref_price_percentage: this.options.max_reference_price_percentage, 
            }
            return isItemEligible(itemPropertiesToCheck)
        })

        const withStickerPrices = eligibleItems.map(item=>{
            const stickers  = editItemStickers(this.stickersCache, item.asset_info.info.stickers) 

            return { 
                id: item.asset_info.assetid,
                img_url: itemImgURL,
                name: itemName,
                price: Number(item.price),
                reference_price: itemReferencePrice,
                number_of_stickers: stickers.length,
                stickers: stickers,
                item_offer_url: getItemOfferURL(item.user_id, itemName),
                paintwear: item.asset_info.paintwear
            }
        })

        withStickerPrices.forEach(item => {
            this.appendItem(item)
        })

        const end = performance.now()
        this.scrapingTimesArray.push((end - start))
    }
    
    @Cron("0 0 * * *")
    async fetchStickersCache(){
        const stickersCacheURL = "https://stickers-server-adjsr.ondigitalocean.app/array"
        this.stickersCache = await fetch(stickersCacheURL, {method: 'GET'})
        .then(res => res.json())
        .catch(error => {
            this.errors.request_errors++
            console.error(`\nError during stickers fetch: ${error}`)
        })
        console.log("\nFetched latest stickers!")
    }

    async scrapeArrayOfItemCodes(array: Array<string>, proxy: string){
        for(let i = 0; i < array.length; i++){
            await this.scrapePage(array[i], proxy)
            await sleepMs(this.options.sleep_ms)
        }
    }

    async startQueue(){
        const queue = new QueueService()
        const proxies = queue.proxies
        const arraysToScrape = queue.arraysToScrape
        
        let promises = []
        for(let i = 0; i < proxies.length; i++){ // Populates an array with scrapeArrayOfItems promises 
            promises.push(this.scrapeArrayOfItemCodes(arraysToScrape[i], proxies[i]))
        }
        
        console.log("\nQueue has been started!")
        await Promise.all(promises) // Executes the promises simultaneously
    }

    appendItem(item: Item) {
        if(item === undefined){return}

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
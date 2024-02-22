import { Injectable, OnModuleInit } from '@nestjs/common'
import { comparePrices, editItemStickers, getItemOfferURL, getItemURL, getRequestHeaders, isSaved, parseItemName, sleep } from '../external/general'
import { ReplaySubject } from 'rxjs'
import { Cron } from '@nestjs/schedule'
import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { QueueService } from 'src/queue/queue.service'
const os = require('os')

@Injectable()
export class ScraperService implements OnModuleInit {
    async onModuleInit() {
        await this.fetchStickerPrices()
    }

    options = {
        max_reference_price_percentage: -1,
        item_min_price: 0,
        item_max_price: 1_000_000,
        min_memory: 8,
        sleep_ms: 0,
    }

    stickerCache = []

    itemsSubject = new ReplaySubject()
    itemsNum = 0

    stopScraping = false
    
    scrapingTime = []
    propertyUndefinedErrors = 0 // Errors that occur trying to access an undefined property of the JSON response
    requestErrors = 0 // All errors that occur during the fetch
    rateLimitErrors = 0 // Only requests that return status code - "429"
    numberOfPages = 0

    stats = {}
    
    async scrapePage(itemCode: string, proxy: string){
        const start = performance.now()
        this.numberOfPages++
        
        const itemLink = getItemURL(itemCode)

        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`)
        const options = getRequestHeaders(proxyAgent)

        let pageData: any = await fetch(itemLink, options).then(res => res.text()).catch(error => {
            this.requestErrors++
            console.error(`\n${itemCode}: ${error}`)
        })
        
        try{ // HTML handling
            pageData = JSON.parse(pageData)
        }catch(error){
            this.rateLimitErrors++
            console.log(`\n Couldn't parse the response into JSON (${itemCode})\n${error}`)
            return
        }
        
        let itemReferencePrice: number
        try{ // Get the reference price of the item
            itemReferencePrice = Number(pageData.data.goods_infos[`${itemCode}`].steam_price_cny)
        }catch(error){
            this.propertyUndefinedErrors++
            console.log(`\n Reference price property is undefined (${itemCode})\n${error}`)
            return
        }
        
        let itemName: string
        try{ // Get the name of the item
            itemName = parseItemName(pageData.data.goods_infos[`${itemCode}`].name)            
        }catch(error){
            this.propertyUndefinedErrors++
            console.log(`\n Name property is undefined (${itemCode})\n${error}`)
            return
        }
        
        let itemImgURL: string
        try{ // Get the item image URL
            itemImgURL = pageData.data.goods_infos[`${itemCode}`].icon_url
        }catch(error){
            this.propertyUndefinedErrors++
            console.log(`\n Image URL property is undefined (${itemCode})\n${error}`)
            return
        }

        let itemsArray: any[]
        try{ // Get the item array
            itemsArray = pageData.data.items
        }catch(error){
            this.propertyUndefinedErrors++
            console.log(`\n Items property is undefined (${itemCode})\n${error}`)
            return
        }

        itemsArray.map(item => {
            const itemPrice = Number(item.price)

            const isPriceNotInRange = itemPrice < this.options.item_min_price || itemPrice > this.options.item_max_price
            if(isPriceNotInRange){return} // Go to the next item if the current one's price is out of the options' range

            const priceToReferencePrice = comparePrices(this.options.max_reference_price_percentage, itemReferencePrice, itemPrice)
            if(!priceToReferencePrice){return} // Go to the next item if the current one's price is more than x% over the reference price

            let itemStickers = item.asset_info.info.stickers
            if(itemStickers.length === 0){return} // Go to the next item if the current one has no stickers
            
            itemStickers = editItemStickers(this.stickerCache, itemStickers) // Remove unnecessary properties from each sticker object and add its price

            const newItemObject = {
                id: item.asset_info.assetid,
                img_url: itemImgURL,
                name: itemName,
                price: itemPrice,
                reference_price: itemReferencePrice,
                number_of_stickers: itemStickers.length,
                stickers: itemStickers,
                item_offer_url: getItemOfferURL(item.user_id, itemName),
                paintwear: item.asset_info.paintwear
            }

            this.asignItem(newItemObject)
        })

        const end = performance.now()
        this.scrapingTime.push((end - start))
    }
    
    async fetchStickerPrices(){
        const stickerURI = "https://stickers-server-adjsr.ondigitalocean.app/array"
        this.stickerCache = await fetch(stickerURI, {method: 'GET'})
        .then(res => res.json())
        .catch(error => {
            this.requestErrors++
            console.error(`\nError during stickers fetch: ${error}`)
        })
        console.log("\nFetched latest stickers!")
    }

    async scrapeArray(array: Array<string>, proxy: string){
        for(const item of array){
            await this.scrapePage(item, proxy)
            await sleep(this.options.sleep_ms)
        }
    }

    async startQueue(){
        const queue = new QueueService()
        const proxies = queue.proxies
        const arraysToScrape = queue.arraysToScrape
        
        let promises = []
        for(let i = 0; i < proxies.length; i++){
            promises.push(this.scrapeArray(arraysToScrape[i], proxies[i]))
        }
        
        console.log("\nQueue has been started!")
        await Promise.all(promises)
    }

    asignItem(item: any): void {
        if(!isSaved(this.itemsSubject, item.id)){
            this.itemsSubject.next({data: item})
            this.itemsNum++
        }
    }

    updateOptions(newOptions: any){
        this.options = newOptions
    }
    
    clearItems(): void {
        this.itemsSubject.complete()
        this.itemsSubject = new ReplaySubject()

        this.itemsNum = 0

        this.stats = {}

        this.scrapingTime = []

        this.propertyUndefinedErrors = 0
        this.requestErrors = 0
        this.rateLimitErrors = 0

        this.numberOfPages = 0

        console.log(`\nItems and Logs have been cleared!`)
    }

    @Cron("*/1 * * * * *")
    getStats(){
        const freeMemory = Math.round(os.freemem() / 1024 / 1024)
        const totalMemory = Math.round(os.totalmem() / 1024 / 1024)
        const memoryPercetage = (freeMemory / totalMemory) * 100

        const errors = {
            total_errors: this.propertyUndefinedErrors + this.requestErrors + this.rateLimitErrors,
            property_undefined_errors: this.propertyUndefinedErrors,
            request_errors: this.requestErrors,
            "429_errors": this.rateLimitErrors,
        }

        if(memoryPercetage < this.options.min_memory){
            this.clearItems()
        }

        const stats = {
            date: new Date().toString(),
            number_of_items: this.itemsNum,
            pages_scraped: this.numberOfPages,
            average_scrape_time_ms: (this.scrapingTime.reduce((a, b) => a + b, 0) / this.scrapingTime.length).toFixed(2),
            errors: errors,
            free_memory: freeMemory,
            free_memory_percentage: memoryPercetage,
            total_memory: totalMemory,
            options: this.options
        }

        this.stats = stats
    }
}
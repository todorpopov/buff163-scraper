import { Injectable, OnModuleInit } from '@nestjs/common'
import { comparePrices, editItemStickers, getItemOfferURL, getItemURL, getRequestHeaders, isSaved, parseItemName } from '../other/scraper'
import { sleep } from '../other/general'
import { ReplaySubject } from 'rxjs'
import { Cron } from '@nestjs/schedule'
import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { QueueService } from 'src/queue/queue.service'
import { Item } from 'src/types/response.item.type'
import { ObservableItem } from 'src/types/item.observable.type'
import { Options } from 'src/types/options.type'
import { CachedSticker } from 'src/types/sticker.cache.type'
import { Error } from 'src/types/error.type'
import { ServerStatistics } from 'src/types/statistics.type'
const os = require('os')

@Injectable()
export class ScraperService implements OnModuleInit {
    async onModuleInit() {
        await this.fetchStickerPrices()

        const currentEnvironment = process.env.ENV
        if(currentEnvironment === "local"){
            fetch(`http://localhost:3000/scraper/start`, { method: "POST"}).catch(error => console.error('\nServer start fetch: ' + error))
        }else{
            fetch("https://buff163scraper.aisoftware.bg/scraper/start", { method: "POST"}).catch(error => console.error('\nServer start fetch: ' + error))
        }
    }

    options: Options
    stickerCache: Array<CachedSticker>
    itemsSubject: ReplaySubject<ObservableItem>
    itemsNum: number
    scrapingTime: Array<number>
    errors: Error
    numberOfPages: number
    stats: ServerStatistics
    
    constructor(){
        this.options = {
            max_reference_price_percentage: -1,
            item_min_price: 0,
            item_max_price: 1_000_000,
            min_memory: 8,
            sleep_ms: 0,
        }
        this.errors = {
            total_errors: 0,
            property_undefined_errors: 0,
            request_errors: 0,
            tmr_errors: 0,
        }
        this.stickerCache = []
        this.itemsSubject = new ReplaySubject<ObservableItem>()
        this.itemsNum = 0
        this.scrapingTime = []
        this.numberOfPages = 0
    }

    async scrapePage(itemCode: string, proxy: string){
        const start = performance.now()
        this.numberOfPages++
        
        const itemLink = getItemURL(itemCode)

        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`)
        const options = getRequestHeaders(proxyAgent)

        let pageData: any = await fetch(itemLink, options).then(res => res.text()).catch(error => {
            this.errors.request_errors++
            console.error(`\n${itemCode}: ${error}`)
        })
        
        try{ // HTML handling
            pageData = JSON.parse(pageData)
        }catch(error){
            this.errors.tmr_errors++
            console.log(`\n Couldn't parse the response into JSON (${itemCode})\n${error}`)
            return
        }
        
        let itemReferencePrice: number
        try{ // Get the reference price of the item
            itemReferencePrice = Number(pageData.data.goods_infos[`${itemCode}`].steam_price_cny)
        }catch(error){
            this.errors.property_undefined_errors++
            console.log(`\n Reference price property is undefined (${itemCode})\n${error}`)
            return
        }
        
        let itemName: string
        try{ // Get the name of the item
            itemName = parseItemName(pageData.data.goods_infos[`${itemCode}`].name)            
        }catch(error){
            this.errors.property_undefined_errors++
            console.log(`\n Name property is undefined (${itemCode})\n${error}`)
            return
        }
        
        let itemImgURL: string
        try{ // Get the item image URL
            itemImgURL = pageData.data.goods_infos[`${itemCode}`].icon_url
        }catch(error){
            this.errors.property_undefined_errors++
            console.log(`\n Image URL property is undefined (${itemCode})\n${error}`)
            return
        }

        let itemsArray: any[]
        try{ // Get the item array
            itemsArray = pageData.data.items
        }catch(error){
            this.errors.property_undefined_errors++
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
            this.errors.request_errors++
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

    asignItem(item: Item): void {
        if(!isSaved(this.itemsSubject, item.id)){
            this.itemsSubject.next({ data: item })
            this.itemsNum++
        }
    }

    updateOptions(newOptions: any){
        this.options = newOptions
    }
    
    clearItems() {
        this.itemsSubject.complete()
        this.itemsSubject = new ReplaySubject<ObservableItem>()
        this.itemsNum = 0
        this.stats
        this.scrapingTime = []
        this.errors = {
            total_errors: 0,
            property_undefined_errors: 0,
            request_errors: 0,
            tmr_errors: 0,
        }
        this.numberOfPages = 0

        console.log(`\nItems and Logs have been cleared!`)
    }

    @Cron("*/1 * * * * *")
    getStats(){
        const freeMemory = Math.round(os.freemem() / 1024 / 1024)
        const totalMemory = Math.round(os.totalmem() / 1024 / 1024)
        const memoryPercetage = (freeMemory / totalMemory) * 100

        const errors = {
            total_errors: this.errors.property_undefined_errors + this.errors.request_errors + this.errors.tmr_errors,
            property_undefined_errors: this.errors.property_undefined_errors,
            request_errors: this.errors.request_errors,
            tmr_errors: this.errors.tmr_errors,
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
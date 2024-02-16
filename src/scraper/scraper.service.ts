import { Injectable } from '@nestjs/common'
import { getRandomItem, checkStickerCache, parseFile, sleep, comparePrices, proxiesArray, shuffleArray } from './external_functions'
import { ReplaySubject } from 'rxjs'
import { Cron } from '@nestjs/schedule'
import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
const os = require('os')

@Injectable()
export class ScraperService {
    async scrapePage(itemObject, proxy){
        const start = performance.now()

        if(this.stickerCache.length === 0){
            await this.fetchStickerPrices()
        }

        this.numberOfPages++

        const itemLink = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${itemObject.code}&page_num=1`

        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`)
        let pageData: any = await fetch(itemLink, {method: 'GET', agent: proxyAgent}).then(res => res.text()).catch(err => {
            this.errors++
            this.errorItemCodes.push(itemObject.code)
            console.error('error - 1: ' + err)
        })
        
        let itemsArray: any[]
        let itemReferencePrice: number
        let itemImgURL: string
        try{
            pageData = JSON.parse(pageData)
            itemsArray = pageData.data.items
            itemReferencePrice = pageData.data.goods_infos[`${itemObject.code}`].steam_price_cny
            itemImgURL = pageData.data.goods_infos[`${itemObject.code}`].icon_url
        }catch(error){
            console.log(itemObject.code + ': ' + error)
            this.errors++
            this.errorItemCodes.push(itemObject.code)
            return
        }


        itemsArray.forEach(item => {
            const itemPrice = Number(item.price)
            const priceDifference = comparePrices(120, itemReferencePrice, itemPrice)

            if(priceDifference !== true){return}

            const itemStickers = item.asset_info.info.stickers
            if(itemStickers.length === 0){return}
            
            itemStickers.forEach(async(sticker) => {
                delete sticker.category
                delete sticker.sticker_id
                sticker.price = checkStickerCache(this.stickerCache, `Sticker | ${sticker.name}`)
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
    
    stickerCache = []
    async fetchStickerPrices(){
        const stickerURI = "https://stickers-server-adjsr.ondigitalocean.app/array"
        this.stickerCache = await fetch(stickerURI, {method: 'GET'}).then(res => res.json()).catch(err => console.error('error - stickers fetch: ' + err))
        console.log("\nFetched latest stickers!")
    }

    itemFileContent = parseFile('./src/files/ids.txt')

    async queue(proxy: string){
        const start = performance.now()

        shuffleArray(this.itemFileContent)
        console.log(`\nNew queue started!\nProxy: ${proxy}`)

        for(const item of this.itemFileContent){
            console.log(item)
            await this.scrapePage(item, proxy)
        }

        const end = performance.now()
        console.log(`\nTime to iterate over queue: ${((end - start) / 1000).toFixed(2)} s`)
    }

    startQueues(){
        for(const proxy of proxiesArray){
            this.queue(proxy)
        }
    }


    errorItemCodes = []


    itemsSubject = new ReplaySubject()
    itemsNum = 0

    scrapingTime = []
    errors = 0
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
        this.numberOfPages = 0

        console.log(`\nItems and Logs cleared on: ${new Date()}\n`)
    }


    stats = {}
    @Cron("*/1 * * * * *")
    getStats(){
        const freeMemory = Math.round(os.freemem() / 1024 / 1024)
        const totalMemory = Math.round(os.totalmem() / 1024 / 1024)
        const memoryPercetage = (freeMemory / totalMemory) * 100

        if(memoryPercetage < 10){
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
            total_memory: totalMemory
        }

        this.stats = stats
    }
}
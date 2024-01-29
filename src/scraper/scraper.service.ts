import { Injectable } from '@nestjs/common';
import { Browser, chromium } from 'playwright'
import { parseStickersPrices, getRandomItemCodes } from './external_functions';
import { ReplaySubject } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import { performance } from 'perf_hooks';

const os = require('node-os-utils')

const NUMBER_OF_ITEM_CODES = 1

@Injectable()
export class ScraperService {
    async scrapeItemsDetails(browser: Browser, itemCode: string){
        const link = `https://buff.163.com/goods/${itemCode}#page_num=1`
        const page = await browser.newPage()
        await page.goto(link)

        const items = await page.$$eval('tr.selling', (allItems = []) => {
            const itemsArray = [];
            allItems.forEach(async (item) => {
                const assetInfo = item.dataset.assetInfo
                const goodsInfo = item.dataset.goodsInfo
                const orderInfo = item.dataset.orderInfo
                const sellerInfo = item.dataset.seller
                
                const assetInfoJson = JSON.parse(assetInfo)
                const goodsInfoJson = JSON.parse(goodsInfo)
                const orderInfoJson = JSON.parse(orderInfo)
                const sellerInfoJson = JSON.parse(sellerInfo)
                
                let itemName = goodsInfoJson.market_hash_name
                if(itemName.includes('StatTrak')){
                    itemName = itemName.slice(10)
                }

                const stickers = assetInfoJson.info.stickers

                for(let sticker of stickers){
                    delete sticker.img_url
                    delete sticker.category
                }

                itemsArray.push({
                    id: assetInfoJson.assetid,
                    order_id: orderInfoJson.id,
                    name: itemName,
                    steam_price_usd: Number(goodsInfoJson.steam_price),
                    buff163_price_cny: Number(orderInfoJson.price),  
                    lowest_price_cny: Number(orderInfoJson.lowest_bargain_price),
                    number_of_stickers: stickers.length,
                    stickers: stickers,
                    seller_id: sellerInfoJson.user_id,
                    seller_profile_link: `https://buff.163.com/shop/${sellerInfoJson.user_id}#tab=selling&game=csgo&page_num=1&search=${itemName.replaceAll(' ', '%20')}`,
                    has_cooldown: assetInfoJson.has_tradable_cooldown,
                    paintwear: assetInfoJson.paintwear,
                })
            })
            return itemsArray
        }) || []

        await page.close()
        return items
    }

    async scrapeStickersPrices(browser: Browser, itemCode: string){
        const link = `https://buff.163.com/goods/${itemCode}#page_num=1`
        const page = await browser.newPage()
        await page.goto(link)
        
        let stickers = []
        const table = await page.locator('td.img_td').elementHandles()
        for (let i = 0; i < table.length; i++) {
            await table[i].hover()
            await page.waitForTimeout(1000)
            const stickerPrices = await page.locator('//div[@class = "sticker-name"]').allInnerTexts() || []
            const itemStickers = parseStickersPrices(stickerPrices)
            stickers.push(itemStickers)
        }
        await page.close()
        return(stickers)
    }
    
    async scrapeAllDetails(itemCode: string){
        const start = performance.now()
        let browser: Browser

        try{
            browser = await chromium.launch()

        }catch(error){
            console.log(error)
        }

        const items = await this.scrapeItemsDetails(browser, itemCode) || []
        const stickerPrices = await this.scrapeStickersPrices(browser, itemCode) || []
        
        if(items.length !== stickerPrices.length) return "Items and stickers don't match"
        
        for(let i = 0; i < items.length; i++){
            const stickerNum = items[i].number_of_stickers
            if(stickerNum === 0) continue
            
            if(stickerNum !== stickerPrices[i].length){
                items[i].sticker_error = true
            }
            
            for(let j = 0; j < stickerNum; j++){
                items[i].stickers[j].price = stickerPrices[i][j]
            }
        }

        await browser.close()
        const end = performance.now()
        console.log(`Scrape all: ${Math.round((end - start) / 1000)} s`)

        return items
    }
    
    async scrapeMultiplePages(){
        const itemCodes = getRandomItemCodes(NUMBER_OF_ITEM_CODES)
        
        let itemsDetails = []
        for(let i = 0; i < itemCodes.length; i++){
            itemsDetails.push(await this.scrapeAllDetails(itemCodes[i]))
        }
        
        return itemsDetails.flat()
    }

    async getOnlyItemsWithStickers() {
        const items = await this.scrapeMultiplePages() || []
        const itemsWithStickers = [];
        items.forEach(item => {
            if(item.number_of_stickers !== 0){
                itemsWithStickers.push(item)
            }
        })

        return itemsWithStickers
    }
    
    @Cron("*/1 * * * *")
    async getDataSse() {
        const items = await this.getOnlyItemsWithStickers() || [];
        this.asignItems(items)
    }

    //@Cron("1 */2 * * *")
    async availability(){
        const start = performance.now()
        const arrayCopy = [...this.itemsArray]

        const links = []
        arrayCopy.forEach(item => {
            links.push(item.seller_profile_link)
        })

        const availableItemsLinks = await this.checkItemsAvailability(links)

        const remainingItems = []
        arrayCopy.forEach(item => {
            if(availableItemsLinks.includes(item.seller_profile_link))
            remainingItems.push(item)
        })

        this.clearItems()
        this.asignItems(remainingItems)
        
        const end = performance.now()
        console.log(`\nNumber of links that returned available: ${availableItemsLinks.length}`)
        console.log(`Number of items: Pre(${arrayCopy.length}) | Post(${remainingItems.length})`)
        console.log(`Time to check and remove elements: ${Math.round((end - start) / 1000)} s\n`)
    }

    async checkItemsAvailability(links: string[]): Promise<Array<string>> {
        let browser: Browser
        
        try{
            browser = await chromium.launch()

        }catch(error){
            console.log(error)
        }
        
        let results = []
        const page = await browser.newPage()
        for(let i = 0; i < links.length; i++){
            const start = performance.now()
            await page.goto(links[i])

            let statement = false 
            try{
                statement = await page.isVisible("div.nodata")

            }catch(error){
                console.log(error)
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            
            if(!statement){
                results.push(links[i])
            }

            const end = performance.now()
            console.log(`Time to check link: ${Math.round((end - start) / 1000)} s`)
        }
        await page.close()

        await browser.close()
        return results
    }
    


    itemsSubject = new ReplaySubject(250, (1000 * 60 * 60 * 24))
    itemsArray = []

    asignItems(items: any[]): void {
        items.forEach(item => {
            this.itemsSubject.next({data: item})
            this.itemsArray.push(item)
        })
    }
    
    //@Cron("0 0 * * *")
    clearItems(): void {
        this.itemsSubject.complete()
        this.itemsSubject = new ReplaySubject(250, (1000 * 60 * 60 * 24))
        this.itemsArray = []
        console.log(`\nItems cleared on: ${new Date()}\n`)
    }

    statsArray = []
    @Cron("*/5 * * * *")
    async getStats(){
        const date = new Date()

        const cpuInfo = await os.cpu.usage().then(info => {return info})
        const memoryInfo = await os.mem.free().then(info => {return info})

        const stats = { 
            number_of_items: this.itemsArray.length,
            cpu_load_percentage: cpuInfo,
            free_memory_mb: Math.round(memoryInfo.freeMemMb),
            total_memory_mb: Math.round(memoryInfo.totalMemMb),
        }

        this.statsArray.push({time: `${date.getHours()}:${date.getMinutes()}`,data: stats})
    }
}
import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright'
import { parseStickersPrices, getRandomItemCodes } from './external_functions';
import { ReplaySubject, from, of } from 'rxjs';
import { Cron } from '@nestjs/schedule';

const NUMBER_OF_ITEM_CODES = 1

@Injectable()
export class ScraperService {
    async scrapeItemsDetails(itemCode: string){
        const link = `https://buff.163.com/goods/${itemCode}#page_num=1`
        const browser = await chromium.launch()
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

        await browser.close()
        return items
    }

    async scrapeStickersPrices(itemCode: string){
        const link = `https://buff.163.com/goods/${itemCode}#page_num=1`
        const browser = await chromium.launch()
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
        await browser.close()
        return(stickers)
    }
    
    async scrapeAllDetails(itemCode: string){
        const items = await this.scrapeItemsDetails(itemCode) || []
        const stickerPrices = await this.scrapeStickersPrices(itemCode) || []
        
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
    
    @Cron("*/5 * * * *")
    async getDataSse() {
        const items = await this.getOnlyItemsWithStickers() || [];
        this.asignItems(items)
    }

    @Cron("1 */4 * * *")
    async generalAvailability(){
        const start = performance.now()

        const items = [...this.itemsArray]
        console.log("Array length (pre): " + items.length)

        let false_num = 0
        for(let i = 0; i < items.length; i++){
            console.log(`Link: ${items[i].seller_profile_link}`)
            const statement = await this.checkItemAvailability(items[i].seller_profile_link)
            console.log(`Statement: ${statement}`)
            if(statement !== true){
                items.splice(i, 1)
                false_num++
            }
        }
        console.log("Array length (post): " + items.length)
        console.log("Number of falses: " + false_num)

        this.clearItems()
        this.asignItems(items)

        const end = performance.now()   
        console.log(`Check item availability: ${((end - start) / 60000).toFixed(2)} m`)
        return { msg: "Successfully removed unavailable items!"}
    }

    async checkItemAvailability(link: string): Promise<boolean> {
        const browser = await chromium.launch()
        const page = await browser.newPage()
        await page.goto(link)

        const notVisible = await page.isVisible("div.nodata")

        if(!notVisible){
            return true
        }
        
        return false
    }
    


    itemsSubject = new ReplaySubject()
    itemsArray = []

    asignItems(items: any[]): void {
        items.forEach(item => {
            this.itemsSubject.next({data: item})
            this.itemsArray.push(item)
        })
    }
    
    @Cron("0 0 * * *")
    clearItems(): void {
        this.itemsSubject.complete()
        this.itemsSubject = new ReplaySubject()
        this.itemsArray = []
    }
}
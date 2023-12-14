import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright'
import { parseStickersPrices, getRandomItemCodes } from './external_functions';
import { Observable, map, of} from 'rxjs';
import { Cron, Timeout } from '@nestjs/schedule';
import { subscribe } from 'diagnostics_channel';

const NUMBER_OF_ITEM_CODES = 10

@Injectable()
export class ScraperService {
    async scrapeItemsDetails(itemCode: string){
        const link = `https://buff.163.com/goods/${itemCode}#page_num=1`
        const browser = await chromium.launch()
        const page = await browser.newPage()
        await page.goto(link)
        
        const items = await page.$$eval('tr.selling', allItems => {
            const itemsArray: any[] = []
            allItems.forEach(async (item) => {

                const assetInfo = item.dataset.assetInfo
                const goodsInfo = item.dataset.goodsInfo
                const orderInfo = item.dataset.orderInfo
                const sellerInfo = item.dataset.seller
                
                const assetInfoJson = JSON.parse(assetInfo)
                const goodsInfoJson = JSON.parse(goodsInfo)
                const orderInfoJson = JSON.parse(orderInfo)
                const sellerInfoJson = JSON.parse(sellerInfo)
                
                const stickers = assetInfoJson.info.stickers

                for(let sticker of stickers){
                    delete sticker.img_url
                    delete sticker.category
                }

                itemsArray.push({
                    id: assetInfoJson.assetid,
                    order_id: orderInfoJson.id,
                    name: goodsInfoJson.market_hash_name,
                    steam_price_usd: Number(goodsInfoJson.steam_price),
                    buff163_price_cny: Number(orderInfoJson.price),  
                    lowest_price_cny: Number(orderInfoJson.lowest_bargain_price),
                    number_of_stickers: stickers.length,
                    stickers: stickers,
                    seller_id: sellerInfoJson.user_id,
                    seller_profile_link: `https://buff.163.com/shop/${sellerInfoJson.user_id}#tab=selling&game=csgo&page_num=1&search=${goodsInfoJson.market_hash_name.replaceAll(' ', '%20')}`,
                    has_cooldown: assetInfoJson.has_tradable_cooldown,
                    paintwear: assetInfoJson.paintwear,
                })
            })
            return itemsArray
        })

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

            // const wait = randomTime(200, 600)
            // console.log(wait)

            await page.waitForTimeout(1000)
            const stickerPrices = await page.locator('//div[@class = "sticker-name"]').allInnerTexts()
            const itemStickers = parseStickersPrices(stickerPrices)
            stickers.push(itemStickers)

            // await page.waitForSelector('//div[@class = "floattip"]').then( async () => {
            //     const stickerPrices = await page.locator('//div[@class = "sticker-name"]').allInnerTexts()
            //     const itemStickers = parseStickersPrices(stickerPrices)
            //     stickers.push(itemStickers)
            // }).catch(() => {
            //     stickers.push(-1)
            // });
        }
        await browser.close()
        return(stickers)
    }
    
    async scrapeAllDetails(itemCode: string){
        const start = performance.now()
        const items = await this.scrapeItemsDetails(itemCode)
        const stickerPrices = await this.scrapeStickersPrices(itemCode)
        
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
        const end = performance.now()
        console.log(`Scraping details and prices took ${end - start}ms`)
        return items
    }
    
    async scrapeMultiplePages(){
        const start = performance.now()
        const itemCodes = getRandomItemCodes(NUMBER_OF_ITEM_CODES)
        
        let itemsDetails = []
        for(let i = 0; i < itemCodes.length; i++){
            itemsDetails.push(await this.scrapeAllDetails(itemCodes[i]))
        }
        
        const end = performance.now()
        console.log(itemsDetails.length)
        console.log(`Scraping 10 item pages (44946) ${end - start}ms`)
        return itemsDetails.flat()
    }

    async getOnlyItemsWithStickers() {
        const items = await this.scrapeMultiplePages()
        const itemsWithStickers = []
        items.forEach(item => {
            if(item.number_of_stickers !== 0){
                itemsWithStickers.push(item)
            }
        })

        return itemsWithStickers
    }

    itemEventsObservable: Observable<any> = new Observable()

    @Cron("*/30 * * * * *")
    async getDataSse() {
        const randcode = getRandomItemCodes(1)[0]
        const items = await this.scrapeItemsDetails(randcode)
        console.log(`Random code: ${randcode}`)

        this.itemEventsObservable = of(items)
        this.itemEventsObservable.forEach((x) => console.log(x))
    }
}
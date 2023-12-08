import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright'
import { parseStickersPrices } from './external_functions';

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
                    steam_price: "USD " + goodsInfoJson.steam_price,
                    buff163_price: "CNY " + orderInfoJson.price,  
                    lowest_price: "CNY " + orderInfoJson.lowest_bargain_price,
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
        console.log(items[0])
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
            // await page.waitForTimeout(1000)
            await page.waitForSelector('//div[@class = "floattip"]').then( async () => {
                const stickerPrices = await page.locator('//div[@class = "sticker-name"]').allInnerTexts()
                const itemStickers = parseStickersPrices(stickerPrices)
                stickers.push(itemStickers)
            }).catch(() => {
                stickers.push("!!!Could not find!!!")
            });
        }
        console.log(stickers)
        await browser.close()
        return(stickers)
    }
    
    async scrapeAllDetails(itemCode: string){
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
        // console.log(items)
        // console.log(items[0])
        return items
    }

    async scrapeMultiplePages(){
        const itemCodes = ['44946', '44946', '44946', '44946', '44946']
        let itemsDetails = []
        for(let i = 0; i < itemCodes.length; i++){
            itemsDetails.push(await this.scrapeAllDetails(itemCodes[i]))
        }

        console.log(`Number of item pages: ${itemCodes.length}`)
        console.log(`Total number of items: ${itemsDetails.flat().length}`)
        return itemsDetails
    }
}
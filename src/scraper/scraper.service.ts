import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright'
import { parseStickersPrices } from './external_functions';

@Injectable()
export class ScraperService {
    async scrapeItemsDetails(itemCode: string){
        const link = `https://buff.163.com/goods/${itemCode}#page_num=1`
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(link);
        
        const items = await page.$$eval('tr.selling', allItems => {
            const elem: any[] = []
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

                elem.push({
                    id: assetInfoJson.assetid,
                    name: goodsInfoJson.market_hash_name,
                    steam_price: "USD " + goodsInfoJson.steam_price,
                    buff163_price: "CNY " + orderInfoJson.price,  
                    lowest_price: "CNY " + orderInfoJson.lowest_bargain_price,
                    number_of_stickers: stickers.length,
                    stickers: stickers,
                    seller_id: sellerInfoJson.user_id,
                    has_cooldown: assetInfoJson.has_tradable_cooldown,
                    paintwear: assetInfoJson.paintwear,
                })
            })
            return elem
        })

        await browser.close()
        return items
    }

    
    async scrapeStickersPrices(itemCode: string){
        const link = `https://buff.163.com/goods/${itemCode}#page_num=1`
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(link);
        
        let stickers = []
        const table = await page.locator('td.img_td').elementHandles();
        for (let i = 0; i < table.length; i++) {
            await table[i].hover();
            await page.waitForTimeout(1000);
            const stickerPrices = await page.locator('//div[@class = "sticker-wrapper"]').allInnerTexts()
            const itemStickers = parseStickersPrices(stickerPrices)
            stickers.push(itemStickers)
        }
        
        await browser.close()
        console.log(stickers)
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
        console.log(items[0])
        return items
    }

    async scrapeMultiplePages(){
        const itemCodes = ['45462', '756142', '44946', '757522', '857690', '857611', '857610', '857716', '857609', '857703', '857609']
        let itemsDetails = []
        for(let i = 0; i < itemCodes.length; i++){
            itemsDetails.push(await this.scrapeAllDetails(itemCodes[i]))
        }
        console.log(itemsDetails)
        console.log(`Number of item pages: ${itemCodes.length}`)
        console.log(`Total number of items: ${itemsDetails.flat().length}`)
        return itemsDetails
    }
}
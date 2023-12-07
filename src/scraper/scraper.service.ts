import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright'
import { parseStickersPrices, parseStickersString } from './external_functions';

@Injectable()
export class ScraperService {
    async scrapeItemDetails(itemCode: string){
        const link = `https://buff.163.com/goods/${itemCode}#page_num=1`
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(link);

        // const stickersPrices = []
        // await this.scrapeStickersPrices(itemCode).then(item => {
        //     stickersPrices.push(item)
        // })

        // console.log(stickersPrices[0])
        
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
                
                let stickers
                const startIndex = assetInfo.indexOf("stickers")
                if(startIndex === -1){ 
                    stickers = []
                } else{
                    const endIndex = assetInfo.indexOf(']', startIndex)
                    const result = '{"' + assetInfo.slice(startIndex, endIndex + 1) + "}"
                    stickers = JSON.parse(result)
                }
    
                const stickersArr = []
                for(let i = 0; i < stickers.stickers.length; i++){
                    stickersArr.push({
                        name: stickers.stickers.length.name,
                        slot: stickers.stickers.length.slot,
                        id: stickers.stickers.length.sticker_id,
                        wear: stickers.stickers.length.wear,
                        //price: stickersPrices[i][index]
                    })
                }

                elem.push({
                    id: assetInfoJson["assetid"],
                    name: goodsInfoJson["market_hash_name"],
                    steam_price: "USD " + goodsInfoJson["steam_price"],
                    buff163_price: "CNY " + orderInfoJson["price"],  
                    lowest_price: "CNY " + orderInfoJson["lowest_bargain_price"],
                    number_of_stickers: stickersArr.length,
                    stickers: stickersArr,
                    // stickers: parseStickersString(assetInfo),
                    seller_id: sellerInfoJson["user_id"],
                    has_cooldown: assetInfoJson["has_tradable_cooldown"],
                    paintwear: assetInfoJson["paintwear"],
                })
            })
            return elem
        })
        
        // const stickersPrices = await this.stickersPrices(itemCode)
        // console.log(stickersPrices)

        await browser.close()
        // console.log(items)
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
            await page.waitForTimeout(1500);
            const stickerPrices = await page.locator('//div[@class = "sticker-wrapper"]').allInnerTexts()
            const itemStickers = parseStickersPrices(stickerPrices)
            stickers.push(itemStickers)
        }
        
        await browser.close()
        return(stickers)
    }
    
    async combine(itemCode: string){
        const items = await this.scrapeItemDetails(itemCode)
        const stickerPrices = await this.scrapeStickersPrices(itemCode)
        //console.log(stickerPrices)

        for(let i = 0; i < items.length; i++) {
            if(items[i].number_of_stickers === 0) continue

            for(let j = 0; j < stickerPrices.length; j++) {
                console.log(items[i].sticker[j].price)
                console.log(stickerPrices[j])       
            }
        }

        return stickerPrices
    }

    async scrapeMultiple(){
        const itemCodes = ['45462', '756142', '44946', '757522', '857690', '857611', '857610', '857716', '857609', '857703', '857609']
        let itemsDetails = []
        for(let i = 0; i < itemCodes.length; i++){
            itemsDetails.push(await this.scrapeItemDetails(itemCodes[i]))
        }
        console.log(itemsDetails)
        console.log(`Number of item pages: ${itemCodes.length}`)
        console.log(`Total number of items: ${itemsDetails.flat().length}`)
        return itemsDetails
    }
}
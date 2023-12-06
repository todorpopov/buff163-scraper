import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright'

@Injectable()
export class ScraperService {
    async scraper(itemCode: string, pageNum: string){
        const link = `https://buff.163.com/goods/${itemCode}#page_num=${pageNum}`
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(link);

        // await page.waitForTimeout(5000);
        
        // await page.screenshot({ path: `sc1_${itemCode}_${pageNum}.png` })
        // page.on('popup', async popup => {
        //     await page.locator('a.popup-close').click()
        //     await popup.waitForLoadState();
        // });
        // await page.screenshot({ path: `sc2_${itemCode}_${pageNum}.png` })

        const items = await page.$$eval('tr.selling', allItems => {
            const elem: any[] = []
            allItems.forEach(item => {
                const assetInfo = item.dataset.assetInfo
                const goodsInfo = item.dataset.goodsInfo
                const orderInfo = item.dataset.orderInfo
                const seller = item.dataset.seller
                
                const assetInfoJson = JSON.parse(assetInfo)
                const goodsInfoJson = JSON.parse(goodsInfo)
                const orderInfoJson = JSON.parse(orderInfo)
                const sellerJson = JSON.parse(seller)
                
                let stickers: any
                const startIndex = assetInfo.indexOf("stickers")
                if(startIndex === -1){ 
                    stickers = []
                } else{
                    const endIndex = assetInfo.indexOf(']', startIndex)
                    const result = '{"' + assetInfo.slice(startIndex, endIndex + 1) + "}"
                    stickers = JSON.parse(result)
                }

                const stickersArr = []
                for(const sticker of stickers.stickers){
                    stickersArr.push({
                        name: sticker.name,
                        slot: sticker.slot,
                        id: sticker.sticker_id,
                        wear: sticker.wear
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
                    seller_id: sellerJson["user_id"],
                    has_cooldown: assetInfoJson["has_tradable_cooldown"],
                    paintwear: assetInfoJson["paintwear"],
                })
            })
            return elem
        })

        await browser.close()
        console.log(items)
        return items
    }

    async scrapeMultiple(){
        const itemCodes = ['45462', '756142', '44946', '757522', '857690', '857611', '857610', '857716', '857609', '857703', '857609']
        let itemsDetails = []
        for(let i = 0; i < itemCodes.length; i++){
            itemsDetails.push(await this.scraper(itemCodes[i], '1'))
        }
        console.log(itemsDetails)
        console.log(`Number of item pages: ${itemCodes.length}`)
        console.log(`Total number of items: ${itemsDetails.flat().length}`)
        return itemsDetails
    }

    async stickers(itemCode: string, pageNum: string){
        const link = `https://buff.163.com/goods/${itemCode}#page_num=${pageNum}`
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(link);

        const items = await page.$$eval('a.i_Btn.i_Btn_mid2.btn-buy-order ', allItems => {
            const elem: any[] = []
            allItems.forEach(item => {
                const details = item.dataset.assetInfo
                elem.push(details)
            })
            return elem
        })
        await browser.close()
        const stickers = JSON.parse(items[0])
        console.log(stickers.info.stickers)
        return stickers.info.stickers
    }
}

// {"stickers":[
// {"name":"oskar | 2017年克拉科夫锦标赛","slot":0,"sticker_id":2277,"wear":0.1243385598063469},
// {"name":"oskar | 2017年克拉科夫锦标赛","slot":1,"sticker_id":2277,"wear":0},
// {"name":"rain | 2017年亚特兰大锦标赛","slot":2,"sticker_id":1907,"wear":0.7746378183364868},
// {"name":"oskar | 2017年克拉科夫锦标赛","slot":3,"sticker_id":2277,"wear":0.11178454011678696}
// ]}
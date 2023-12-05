import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright'
import { sticker } from './has_stickers'

@Injectable()
export class ScraperService {

    async scraper(param: string){
        const link = "https://buff.163.com/goods/" + param
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(link);

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
                
                const stickers = sticker(assetInfo)

                elem.push({
                    id: assetInfoJson["assetid"],
                    name: goodsInfoJson["market_hash_name"],
                    steam_price: goodsInfoJson["steam_price"],
                    stickers: stickers,
                    buff163_price: orderInfoJson["price"],
                    lowest_price: orderInfoJson["lowest_bargain_price"],
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
}
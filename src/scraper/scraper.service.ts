import { Injectable } from '@nestjs/common';
import { getRandomItem } from './external_functions';
import { ReplaySubject, windowTime } from 'rxjs';
import { Cron } from '@nestjs/schedule';
@Injectable()
export class ScraperService {
    @Cron("*/1 * * * * *")
    async scrapeRandomPage(){
        const start = performance.now()

        const randomItem = getRandomItem()
        const itemLink = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${randomItem.code}&page_num=1`
        
        const options = {
            method: 'GET',
            headers: {Accept: '*/*', 'User-Agent': 'Thunder Client (https://www.thunderclient.com)'}
          };
          
        const pageData = await fetch(itemLink, options)
            .then(res => res.json())
            .catch(err => console.error('error - 1: ' + err));
        
        
        const itemsArray = pageData.data.items || []
        const results = []
        itemsArray.forEach(item => {
            const itemStickers = item.asset_info.info.stickers
            itemStickers.forEach(async(sticker) => {
                delete sticker.img_url
                delete sticker.category
                delete sticker.sticker_id

                const stickerName = "Sticker | " + sticker.name
                const stickerLink = `https://stickers-server-adjsr.ondigitalocean.app/api/${stickerName}`
                const info = await fetch(stickerLink, options).then(res => res.json()).catch(err => console.error('error - 2: ' + err))
                sticker.price = Number(info.price) || 0
            })

            let itemName = randomItem.name
            if(itemName.includes('StatTrak')){
                itemName = itemName.slice(10)
            }

            const newItemObject = {
                id: item.asset_info.assetid,
                name: itemName,
                price: Number(item.price),
                number_of_stickers: itemStickers.length,
                stickers: itemStickers,
                seller_profile_link: `https://buff.163.com/shop/${item.user_id}#tab=selling&game=csgo&page_num=1&search=${itemName.replaceAll(' ', '%20')}`,
                paintwear: item.asset_info.paintwear
            }

            results.push(newItemObject)
        })

        this.asignItems(results)
        const end = performance.now()
        const time = end - start
        this.scrapingTime.push(time)
        console.log(`---\nItem Code:${randomItem.code}\nTime to scrape item data: ${time} ms`)
    }


    itemsSubject = new ReplaySubject(250, (1000 * 60 * 60 * 24))
    itemsArray = []
    scrapingTime = []

    asignItems(items: any[]): void {
        items.forEach(item => {
            this.itemsSubject.next({data: item})
            this.itemsArray.push(item)
        })
    }
    
    @Cron("0 * * * *")
    clearItems(): void {
        this.itemsSubject.complete()
        this.itemsSubject = new ReplaySubject(250, (1000 * 60 * 60 * 24))
        this.itemsArray = []
        console.log(`\nItems cleared on: ${new Date()}\n`)
    }

    statsObs = new ReplaySubject()
    @Cron("*/1 * * * * *")
    async getStats(){
        const date = new Date()

        const stats = { 
            number_of_items: this.itemsArray.length,
            average_scrape_time: this.scrapingTime.reduce((a, b) => a + b, 0) / this.scrapingTime.length
        }

        this.statsObs.next({time: `${date.getHours()}:${date.getMinutes()}`,data: stats})
    }
}
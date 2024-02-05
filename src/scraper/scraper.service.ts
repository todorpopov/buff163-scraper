import { Injectable } from '@nestjs/common';
import { getRandomItem } from './external_functions';
import { ReplaySubject, queue } from 'rxjs';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ScraperService {
    @Cron("*/5 * * * * *")
    async scrapeRandomPage(){
        const start = performance.now()

        const randomItem = getRandomItem()
        const itemLink = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${randomItem.code}&page_num=1`
          
        let pageData: any = await fetch(itemLink, {method: 'GET'}).then(res => res.text()).catch(err => console.error('error - 1: ' + err));
        if(pageData[0] !== "{"){
            console.log(pageData)
            return
        }else{
            pageData = JSON.parse(pageData)
        }
        
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
                const info = await fetch(stickerLink, {method: 'GET'}).then(res => res.json()).catch(err => console.error('error - 2: ' + err))
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

    async queue(){
        while(true){
            await this.scrapeRandomPage()
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }


    itemsSubject = new ReplaySubject()
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
        this.itemsSubject = new ReplaySubject()
        this.itemsArray = []
        console.log(`\nItems cleared on: ${new Date()}\n`)
    }

    statsObs = new ReplaySubject()
    @Cron("*/30 * * * * *")
    async getStats(){
        const date = new Date()

        const stats = { 
            number_of_items: this.itemsArray.length,
            average_scrape_time: this.scrapingTime.reduce((a, b) => a + b, 0) / this.scrapingTime.length
        }

        this.statsObs.next({time: `${date.getHours()}:${date.getMinutes()}`,data: stats})
    }
}
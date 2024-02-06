import { Injectable } from '@nestjs/common';
import { getRandomItem, checkStickerCache } from './external_functions';
import { ReplaySubject } from 'rxjs';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ScraperService {
    // @Cron("*/1 * * * * *")
    async scrapeRandomPage(){
        const start = performance.now()

        const randomItem = getRandomItem()
        const itemLink = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${randomItem.code}&page_num=1`
        
        this.numberOfPages++

        let pageData: any = await fetch(itemLink, {method: 'GET'}).then(res => res.text()).catch(err => console.error('error - 1: ' + err));
        if(pageData[0] !== "{"){
            console.log(pageData)
            this.errors++
            return
        }else{
            pageData = JSON.parse(pageData)
        }
        
        let itemsArray
        try{
            itemsArray = pageData.data.items
        }catch(err){
            console.log(err)
            return
        }

        const results = []
        itemsArray.forEach(item => {
            const itemStickers = item.asset_info.info.stickers
            if(itemStickers.length === 0){return}
            itemStickers.forEach(async(sticker) => {
                delete sticker.img_url
                delete sticker.category
                delete sticker.sticker_id

                const stickerName = "Sticker | " + sticker.name
                const stickerLink = `https://stickers-server-adjsr.ondigitalocean.app/api/${stickerName}`
                let info: any = await fetch(stickerLink, {method: 'GET'}).then(res => res.text()).catch(err => console.error('error - 2: ' + err))
                if(info[0] !== "{"){
                    console.log(info)
                    return
                }else{
                    info = JSON.parse(info)
                }
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
        console.log(`---\nItem Code: ${randomItem.code}\nTime to scrape item data: ${time.toFixed(2)} ms`)
    }

    async queue(items: number){
        console.log(`New queue (${items}) has been started!`)
        for(let i = 0; i < items; i++){
            await this.scrapeRandomPage()
            //await new Promise(resolve => setTimeout(resolve, 750));
        }
    }


    itemsSubject = new ReplaySubject()
    itemsArray = []

    scrapingTime = []
    errors = 0
    numberOfPages = 0

    asignItems(items: any[]): void {
        items.forEach(item => {
            this.itemsSubject.next({data: item})
            this.itemsArray.push(item)
        })
    }
    
    @Cron("*/10 * * * *")
    clearItems(): void {
        this.itemsSubject.complete()
        this.itemsSubject = new ReplaySubject()
        this.itemsArray = []

        this.statsObs.complete()
        this.statsObs = new ReplaySubject()
        this.scrapingTime = []
        this.errors = 0
        this.numberOfPages = 0

        console.log(`\nItems and Logs cleared on: ${new Date()}\n`)
    }

    statsObs = new ReplaySubject()
    @Cron("*/30 * * * * *")
    async getStats(){
        const stats = { 
            number_of_items: this.itemsArray.length,
            pages_scraped: this.numberOfPages,
            average_scrape_time_ms: (this.scrapingTime.reduce((a, b) => a + b, 0) / this.scrapingTime.length).toFixed(2),
            errors: this.errors
        }

        this.statsObs.next({data: stats})
    }
}
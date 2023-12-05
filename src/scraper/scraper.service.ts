import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright'


@Injectable()
export class ScraperService {
    async scraper(itemURI: string){
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(itemURI);
    
        const items = await page.$$eval(".selling", item => {
            const data: any[] = []
            item.forEach(itemDetails => {
                let details1 = itemDetails.dataset.assetInfo
                let details2 = itemDetails.dataset.goodsInfo
                let details3 = itemDetails.dataset.orderInfo
                let details4 = itemDetails.dataset.dataSeller
                if(details1 && details2 && details3 && details4){
                    details1 = JSON.parse(details1)
                    details2 = JSON.parse(details2)
                    details3 = JSON.parse(details3)
                    details4 = JSON.parse(details4)
                }
                if(details2 && details2.hasOwnProperty("market_hash_name"))
                data.push({
                    details1: details1,
                    details2: details2["market_hash_name"],
                    detials3: details3,
                    details4: details4
                })
            return data
            })
        })
    
        await browser.close()
        console.log(items)
    }
}

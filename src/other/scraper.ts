import { ReplaySubject } from 'rxjs'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { Sticker } from 'src/types/response.sticker'
import { CachedSticker } from 'src/types/sticker.cache'
import { Item } from 'src/types/item'
import { ObservableItem } from 'src/types/item.observable'


export function stickerPriceFilter(itemObject: Item, targetPercantage: number) {
    const itemPrice = itemObject.price
    let stickersTotal = 0

    itemObject.stickers.forEach(sticker => {
        stickersTotal += sticker.price
    })

    if(stickersTotal === 0){
        return false
    }
    
    const targetPrice = itemPrice * (targetPercantage / 100)
    if (stickersTotal >= targetPrice){
        return true
    }
    return false
}

function checkStickerCache(stickersCache: Array<CachedSticker>, name: string){
    name = `Sticker | ${name}`
    let itemPrice = 0
    stickersCache.forEach(item => {
        if(item.name === name){
            itemPrice = Number(item.price)
        }
    })
    return itemPrice
}

function priceToRefPricePercentage(maxPercentageDifference: number, referencePrice: number, itemPrice: number){
    if(itemPrice < referencePrice || maxPercentageDifference === -1){return true}

    const percentageDifference = (itemPrice / referencePrice) * 100

    if(percentageDifference > maxPercentageDifference){return false}

    return true
}

export function isSaved(subject: ReplaySubject<ObservableItem>, id: string){
    let statement = false
    subject.forEach(value => {
        if(value.data.id === id){
            statement = true
        }
    })
    return statement
}

export function getItemURL(itemCode: string){
    return `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${itemCode}&page_num=1`
}

export function getFetchOptions(proxyAgent: HttpsProxyAgent<string>){
    return {
        headers: {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "bg-BG,bg;q=0.9,en;q=0.8",
            "sec-ch-ua": "\"Not A(Brand\";v=\"99\", \"Google Chrome\";v=\"121\", \"Chromium\";v=\"121\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest"
        },
        //referrer: "https://buff.163.com/goods/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
        agent: proxyAgent
    }
}

export function getItemOfferURL(userId: string, itemName: string){
    return `https://buff.163.com/shop/${userId}#tab=selling&game=csgo&page_num=1&search=${itemName.replaceAll(' ', '%20')}`
}

export function parseItemName(itemName: string){
    if(itemName.includes('StatTrak')){
        return itemName.slice(10)
    }
    return itemName
}

export function editItemStickers(stickerCache: Array<CachedSticker>, stickersArray: Array<Sticker>){
    let stickersArrayCopy = [...stickersArray]
    stickersArrayCopy.map(sticker => {
        delete sticker.category
        delete sticker.sticker_id
        delete sticker?.offset_x
        delete sticker?.offset_y
    
        sticker.price = checkStickerCache(stickerCache, sticker.name)
    })

    return stickersArrayCopy
}

function priceOutOfRange(min: number, max: number, price: number){
    if(price < min || price > max){return true}
    
    return false
}

export function checkItemProperties(numberOfStickers, minPrice, maxPrice, itemPrice, refPricePercentage, itemReferencePrice){
    // Return false if the item has no stickers
    if(numberOfStickers === 0){
        return false
    } 
            
    // Go to the next item if the current one's price is out of the options' range
    if(priceOutOfRange(minPrice, maxPrice, itemPrice)){
        return false
    } 

    // Go to the next item if the current one's price is more than XXX% over the reference price
    if(!priceToRefPricePercentage(refPricePercentage, itemReferencePrice, itemPrice)){
        return false
    }

    return true
}
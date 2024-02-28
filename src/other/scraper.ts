import { ReplaySubject } from 'rxjs'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { Sticker } from 'src/types/sticker.response'
import { CachedSticker } from 'src/types/sticker.cache'
// import { Item } from 'src/types/item'
import { ObservableItem } from 'src/types/item.observable'
import { ItemProperties } from 'src/types/item.properties'
// import { ResponseItem } from 'src/types/item.response'
// const _ = require('lodash')

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

export function isSaved(subject: ReplaySubject<ObservableItem>, id: string){
    let statement = false

    subject.forEach(value => {
        if(value.data.id === id){
            statement = true
        }
    })

    // _.forEach(subject, function(item) {
    //     if(item.data.id === id){
    //         statement = true
    //     }
    // })
    
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

function getItemOfferURL(userId: string, itemName: string){
    return `https://buff.163.com/shop/${userId}#tab=selling&game=csgo&page_num=1&search=${itemName.replaceAll(' ', '%20')}`
}

export function parseItemName(itemName: string){
    if(itemName.includes('StatTrak')){
        return itemName.slice(10)
    }
    return itemName
}

function editItemStickers(stickerCache: Array<CachedSticker>, stickersArray: Array<Sticker>){
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

export function getItems(properties: ItemProperties){
    return properties.with_stickers.map(item => {
        const stickers  = editItemStickers(properties.stickers_cache, item.asset_info.info.stickers) 
    
        return { 
            id: item.asset_info.assetid,
            img_url: properties.item_img_url,
            name: properties.item_name,
            price: Number(item.price),
            reference_price: properties.item_ref_price,
            number_of_stickers: stickers.length,
            stickers: stickers,
            item_offer_url: getItemOfferURL(item.user_id, properties.item_name),
            paintwear: item.asset_info.paintwear
        }
    })
}
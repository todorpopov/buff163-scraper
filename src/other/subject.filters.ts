import { Item } from "src/types/item"

export function minStickerPriceFilter(itemObject: Item, targetPercantage: number) {
    const itemPrice = itemObject.price
    let stickersTotal = getStickersTotal(itemObject)

    if(stickersTotal === 0){return false}
    
    const targetPrice = itemPrice * (targetPercantage / 100)
    if (stickersTotal >= targetPrice){return true}

    return false
}

export function maxStickerPriceFilter(itemObject: Item, targetPercantage: number) {
    const itemPrice = itemObject.price
    let stickersTotal = getStickersTotal(itemObject)

    if(stickersTotal === 0){return false}
    
    const targetPrice = itemPrice * (targetPercantage / 100)
    if (stickersTotal <= targetPrice){return true}

    return false
}

function getStickersTotal(itemObject: Item){
    return itemObject.stickers.reduce((acc, sticker) => acc + sticker.price, 0)
}

export function minItemPriceFilter(itemObject: Item, minPrice: number){
    const itemPrice = itemObject.price

    if(itemPrice < minPrice){return false}

    return true
}

export function maxItemPriceFilter(itemObject: Item, maxPrice: number){
    const itemPrice = itemObject.price

    if(itemPrice > maxPrice){return false}

    return true
}

export function priceToRefPriceFilter(itemObject: Item, maxPercentageDifference: number){
    const itemPrice = itemObject.price
    const referencePrice = itemObject.reference_price

    if(referencePrice === 0 || itemPrice < referencePrice){return true}

    const percentageDifference = (itemPrice / referencePrice) * 100

    if(percentageDifference > maxPercentageDifference){return false}

    return true
}
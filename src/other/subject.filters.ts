import { Item } from "src/types/item"

export function minStickerPriceFilter(itemObject: Item, targetPercantage: number) {
    if(targetPercantage === -1){return true}

    const itemPrice = itemObject.price
    let stickersTotal = 0

    itemObject.stickers.forEach(sticker => {
        stickersTotal += sticker.price
    })

    if(stickersTotal === 0){return false}
    
    const targetPrice = itemPrice * (targetPercantage / 100)
    if (stickersTotal >= targetPrice){return true}

    return false
}

export function maxStickerPriceFilter(itemObject: Item, targetPercantage: number) {
    if(targetPercantage === -1){return true}

    const itemPrice = itemObject.price
    let stickersTotal = 0

    itemObject.stickers.forEach(sticker => {
        stickersTotal += sticker.price
    })

    if(stickersTotal === 0){return false}
    
    const targetPrice = itemPrice * (targetPercantage / 100)
    if (stickersTotal <= targetPrice){return true}

    return false
}

export function minItemPriceFilter(itemObject: Item, minPrice: number){
    if(minPrice === 0){return true}

    const itemPrice = itemObject.price

    if(itemPrice < minPrice){return false}

    return true
}

export function maxItemPriceFilter(itemObject: Item, maxPrice: number){
    if(maxPrice === -1){return true}

    const itemPrice = itemObject.price

    if(itemPrice > maxPrice){return false}

    return true
}

export function priceToRefPriceFilter(itemObject: Item, maxPercentageDifference: number){
    const itemPrice = itemObject.price
    const referencePrice = itemObject.reference_price

    if(referencePrice === 0 || itemPrice < referencePrice || maxPercentageDifference === -1){return true}

    const percentageDifference = (itemPrice / referencePrice) * 100

    if(percentageDifference > maxPercentageDifference){return false}

    return true
}
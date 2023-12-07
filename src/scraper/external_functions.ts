export function parseStickersPrices(stickersArray: string[]) {
    const itemStickers = []
    for(let i = 0; i < stickersArray.length; i++){
        const startIndex = stickersArray[i].indexOf('(¥')
        let sticker = ""
        if(startIndex === -1){ 
            sticker = "No price"
        }
        const endIndex = stickersArray[i].indexOf(')', startIndex)
        sticker = "CNY " + stickersArray[i].slice(startIndex + 3, endIndex)
        itemStickers.push(sticker)
    }

    return itemStickers
}

export function parseStickersString(infoString: string) {
    let stickers: any
    const startIndex = infoString.indexOf("stickers")

    if(startIndex === -1){ return [] }

    const endIndex = infoString.indexOf(']', startIndex)
    const stringToParse = '{"' + infoString.slice(startIndex, endIndex + 1) + "}"
    const parsedString = JSON.parse(stringToParse)
    console.log(parsedString)
    stickers.push(parsedString)
    
    const stickersArr = []
    for(let i = 0; i < stickers.stickers.length; i++){
        stickersArr.push({
            name: stickers.stickers.length.name,
            slot: stickers.stickers.length.slot,
            id: stickers.stickers.length.sticker_id,
            wear: stickers.stickers.length.wear,
        })
    }
    console.log(stickersArr)
    return infoString
}
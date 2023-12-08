export function parseStickersPrices(stickersArray: string[]) {
    const itemStickers = []
    for(let i = 0; i < stickersArray.length; i++){
        const startIndex = stickersArray[i].indexOf('¥')
        let sticker = ""
        if(startIndex === -1){ 
            sticker = "No price shown"
        } else {
            const endIndex = stickersArray[i].length - 1
            sticker = "CNY " + stickersArray[i].slice(startIndex + 2, endIndex)
        }
        itemStickers.push(sticker)
    }

    return itemStickers
}

// " \n炽炎天使（闪亮）\n印花磨损: 100%   (¥ 4.5)
//
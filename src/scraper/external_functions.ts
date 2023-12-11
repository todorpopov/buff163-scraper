export function parseStickersPrices(stickersArray: string[]) {
    const itemStickers = []
    for(let i = 0; i < stickersArray.length; i++){
        const startIndex = stickersArray[i].indexOf('¥')
        let sticker = 0
        if(startIndex === -1){ 
            sticker = 0
        } else {
            const endIndex = stickersArray[i].length - 1
            sticker = Number(stickersArray[i].slice(startIndex + 2, endIndex))
        }
        itemStickers.push(sticker)
    }

    return itemStickers
}

export function randomTime(min: number, max: number): number {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min)
  }
import * as path from 'path'
import * as fs from 'fs'

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

export function randomNumber(min: number, max: number): number {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min)
}

export function parseFile(): any[]{
    const filePath = path.join(process.cwd(), './src/scraper/item_ids/ids.txt')

    const fileContent = []
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        const splitLines = data.split('\n')
        for(let i = 0; i < splitLines.length; i++) {
            const splitLine = splitLines[i].split(';')
            fileContent.push({
                code: splitLine[0],
                item_name: splitLine[1]
            })
        }
    } catch (err) {
        console.error(err);
    }
    return fileContent
}

export function getRandomItem(fileContent){
    const randLine = randomNumber(0, fileContent.length)
    const randomItem = {
        code: fileContent[randLine].code,
        name: fileContent[randLine].item_name
    }

    return randomItem
}

export function stickerPriceFilter(itemObject, targetPercantage): boolean {
    itemObject = itemObject || {}

    const itemPrice = itemObject.price;
    let stickersTotal = 0;

    (itemObject.stickers || []).forEach(sticker => {
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

export function checkStickerCache(array, name){
    for(const item of array){
        if(item.name === name){
            return Number(item.price)
        }
    }
    return 0
}
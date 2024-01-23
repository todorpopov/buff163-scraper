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

export function getRandomItemCodes(numOfItems: number){
    const fileContent = parseFile()

    const itemCodesArray = []
    for(let i = 0; i < numOfItems; i++){
        const randLine = randomNumber(0, fileContent.length)
        const randItemCode = fileContent[randLine].code
        if(!itemCodesArray.includes(randItemCode)){
            itemCodesArray.push(randItemCode)
        }
    }

    return itemCodesArray
}

export function stickerPriceFilter(itemObject, targetPercantage): boolean {
    itemObject = itemObject || {}

    const itemPrice = itemObject.buff163_price_cny;
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
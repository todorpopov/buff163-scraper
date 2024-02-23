import * as fs from 'fs'

export function parseItemCodesFile(){
    try{
        const data = fs.readFileSync('./src/files/item-codes.txt', 'utf8')
        return data.split('|')
    }catch(error){
        console.error(error)
    }
}

export function shuffleItemCodesArray(array: Array<string>) {
    let currentIndex = array.length
    let randomIndex: number
  
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
    }
}
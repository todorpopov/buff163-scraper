import * as fs from 'fs'

export function parseItemsFile(){
    const fileContent = []

    try{
        const data = fs.readFileSync('./src/files/items.txt', 'utf8')
        const splitLines = data.split('\n')
        for(let i = 0; i < splitLines.length; i++) {
            const splitLine = splitLines[i].split(':')
            fileContent.push(splitLine[0])
        }
    }catch(error){
        console.error(error);
    }

    return fileContent
}

export function parseProxiesFile(){
    let fileContent = []

    try{
        const data = fs.readFileSync('./src/files/proxies.txt', 'utf8')
        const splitLines = data.split('\n')
        for(let i = 0; i < splitLines.length; i++) {
            fileContent.push(splitLines[i].replaceAll('\r', ''))
        }
    }catch(error){
        console.error(error);
    }

    return fileContent
}

export function shuffleItemCodesArray(array: Array<string>) {
    let currentIndex = array.length,  randomIndex;
  
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}
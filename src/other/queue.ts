import * as fs from 'fs'

export function parseItemCodesFile(){
    try{
        const data = fs.readFileSync('./src/files/item-codes.txt', 'utf8')
        return data.split('|')
    }catch(error){
        console.error(error)
    }
}
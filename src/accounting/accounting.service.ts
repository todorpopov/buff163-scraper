import { Injectable } from '@nestjs/common';
import { getDate } from 'src/other/general';
import { Item } from 'src/types/item';

@Injectable()
export class AccountingService {
    mockDatabase: Array<any>
    constructor(){
        this.mockDatabase = []
    }

    getAllData(){
        return this.mockDatabase
    }

    buyItem(item: Item){
        const date = getDate()
        const price = item.price
        const itemStickers = item.stickers

        this.mockDatabase.push({ date: date, item: item})

        console.log(`Item bought!\n date: ${date}\nPrice: ${price}\nStickers: ${itemStickers}`)
    }

    sellItem(itemId: string, sellPrice: number){
        
    }
}

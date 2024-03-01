import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { getDate } from 'src/other/general';
import { AccountingStats } from 'src/types/accounting';
import { Item } from 'src/types/item';
import { AccountingItem } from 'src/types/item.accounting';

@Injectable()
export class AccountingService {
    constructor(@InjectModel('AccountingItem') private readonly accountingItem: Model<AccountingItem>){}
    stats: AccountingStats

    getAllItems(){
        
    }

    getStats(){
        return this.stats
    }

    async buyItem(item: Item){
        const accountingItem = new this.accountingItem({
            date: getDate(),
            item: item
        })

        await accountingItem.save()
    }

    sellItem(itemId: string, sellPrice: number){

    }
}
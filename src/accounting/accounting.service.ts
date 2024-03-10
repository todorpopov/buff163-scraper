import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { getDate } from 'src/other/general';
import { AccountingStats } from 'src/types/accounting';
import { Item } from 'src/types/item';
import { BoughtItem } from 'src/types/item.bought';
import { SoldItem } from 'src/types/item.sold';

@Injectable()
export class AccountingService {
    constructor(
        @InjectModel('BoughtItem') private readonly boughtItem: Model<BoughtItem>,
        @InjectModel('SoldItem') private readonly soldItem: Model<SoldItem>,
        @InjectModel('Item') private readonly itemModel: Model<Item>
    ){}

    async buyItem(itemId: string){
        const existingItem = await this.itemModel.findOne({'id': itemId})

        if(!existingItem){
            console.log(`\n[Buy Item: ${itemId}] - Item doesn't exist!`)
            return
        }

        const stickersTotal = existingItem.stickers.reduce((acc, sticker) => acc + sticker.price, 0)

        const boughtItem = new this.boughtItem({
            date: getDate(),
            id: existingItem.id,
            name: existingItem.name,
            price: existingItem.price,
            stickers_total: stickersTotal
        })

        await boughtItem.save()
        await existingItem.deleteOne()
    }

    async sellItem(itemId: string, sellPrice: number){
        const boughtItem = await this.boughtItem.findOne({'id': itemId})

        if(!boughtItem){
            console.log(`\n[Sell Item: ${itemId}] - Item doesn't exist!`)
            return
        }
        
        const soldItem = new this.soldItem({
            id: boughtItem.id,
            date_bought: boughtItem.date,
            date_sold: getDate(),
            price_bought: boughtItem.price,
            price_sold: sellPrice,
            profit: sellPrice - boughtItem.price
        })
        
        await soldItem.save()
        await boughtItem.deleteOne()
    }

    async getAllBoughtItems(){
        return await this.boughtItem.find({})
    }
    
    async getAllSoldItems(){
        return await this.soldItem.find({})
    }
    
    async getStats(){
        return await this.soldItem.aggregate([
            { $match:{} },
            { $group: { _id: null, total_invested: { $sum: "$price_bought" }, total_profit: { $sum: "$profit" }}}])
    }
}
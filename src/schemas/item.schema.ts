import * as mongoose from 'mongoose';

export const ItemSchema = new mongoose.Schema({
    id: String,
    img_url: String,
    name: String,
    price: Number,
    reference_price: Number,
    number_of_stickers: Number,
    stickers: Array,
    item_offer_url: String,
    paintwear: String
})
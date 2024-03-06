import * as mongoose from 'mongoose';

export const BoughtItemSchema = new mongoose.Schema({
    date: String,
    id: String,
    name: String,
    price: Number,
    stickers_total: Number,
    paintwear: Number
})
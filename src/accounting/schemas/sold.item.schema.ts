import * as mongoose from 'mongoose';

export const SoldItemSchema = new mongoose.Schema({
    id: String,
    date_bought: String,
    date_sold: String,
    name: String,
    price_bought: Number,
    price_sold: Number,
    profit: Number,
})
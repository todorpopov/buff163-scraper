import * as mongoose from 'mongoose';

export const AccountingItemSchema = new mongoose.Schema({
    date: String,
    item: Object
})
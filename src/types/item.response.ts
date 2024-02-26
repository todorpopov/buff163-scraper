import { Sticker } from "./sticker.response"

export type ResponseItem = {
    asset_info: {
        assetid: string,
        info: {
            stickers: Array<Sticker>
        },
        paintwear: string,
    },
    price: string,
    user_id: string
}
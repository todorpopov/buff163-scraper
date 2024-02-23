import { Sticker } from "./response.sticker"

export type ResponseItem = {
    asset_info: {
        assetid: string,
        info: {
            stickers: Array<Sticker>
        },
        paintwear: string,
    },
    price: '84.77',
    user_id: 'U1077866593'
}
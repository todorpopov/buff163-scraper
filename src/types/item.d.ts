import { Sticker } from "./response.sticker"

export type Item = {
    id: string,
    img_url: string,
    name: string,
    price: number,
    reference_price: number,
    number_of_stickers: number,
    stickers: Array<Sticker>
    item_offer_url: string,
    paintwear: string
}
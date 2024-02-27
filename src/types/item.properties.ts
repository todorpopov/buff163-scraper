import { ResponseItem } from "./item.response";
import { CachedSticker } from "./sticker.cache";

export type ItemProperties = {
    with_stickers: Array<ResponseItem>,
    stickers_cache: Array<CachedSticker>,
    item_img_url: string,
    item_name: string,
    item_ref_price: number, 
}
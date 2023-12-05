export function sticker(inputString: string){
    const startIndex = inputString.indexOf("stickers")
    if(startIndex === -1) return ''
    const endIndex = inputString.indexOf(']', startIndex)
    const result = '{"' + inputString.slice(startIndex, endIndex + 1) + "}"
    return JSON.parse(result)
}
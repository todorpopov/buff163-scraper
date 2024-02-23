import { Injectable } from '@nestjs/common';
import { parseItemCodesFile, shuffleItemCodesArray } from 'src/other/queue';

@Injectable()
export class QueueService {
    itemFileContent = []
    proxies = []
    arraysToScrape = []

    constructor() {
        this.itemFileContent = parseItemCodesFile()
        this.proxies = process.env.PROXIES.split(" ")

        shuffleItemCodesArray(this.itemFileContent)
        this.divideQueue()
    }

    divideQueue(){
        const originalArraySize = this.itemFileContent.length
        const chunkSize = originalArraySize / this.proxies.length
        const arrayOfArrays = []

        for (let i = 0; i < originalArraySize; i += chunkSize) {
            arrayOfArrays.push(this.itemFileContent.slice(i, i + chunkSize));
        }

        this.arraysToScrape = arrayOfArrays
    }
}
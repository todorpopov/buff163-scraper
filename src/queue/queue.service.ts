import { Injectable } from '@nestjs/common';
import { parseItemCodesFile, shuffleItemCodesArray } from 'src/other/queue';
const _ = require('lodash')

@Injectable()
export class QueueService {
    itemFileContent = []
    proxies = []
    queueChunks = []

    constructor() {
        this.itemFileContent = parseItemCodesFile()
        this.proxies = process.env.PROXIES.split(" ")

        shuffleItemCodesArray(this.itemFileContent)
        this.divideQueue()
    }

    divideQueue(){
        const chunkSize = Math.round(this.itemFileContent.length / this.proxies.length)
        this.queueChunks = _.chunk(this.itemFileContent, chunkSize)
    }
}
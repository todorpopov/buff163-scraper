import { Injectable } from '@nestjs/common';
import { parseItemCodesFile } from 'src/other/queue';
const _ = require('lodash')

@Injectable()
export class QueueService {
    itemFileContent = []
    proxies = []
    multipleQueues = []

    constructor() {
        this.itemFileContent = parseItemCodesFile()
        this.proxies = process.env.PROXIES.split(" ")
        console.log(`\nRead from proxy variable: ${process.env.PROXIES}`)
        console.log(`\nParsed proxies array: ${this.proxies}`)

        this.divideQueue()
    }

    divideQueue(){
        const fileContentLength = this.itemFileContent.length
        const numberOfProxies = this.proxies.length
        const chunkSize = Math.floor(fileContentLength / numberOfProxies)

        console.log(`\nNumber of queues: ${numberOfProxies}\nQueue size: ${chunkSize}`)
        this.multipleQueues = _.chunk(this.itemFileContent, chunkSize)
    }
}
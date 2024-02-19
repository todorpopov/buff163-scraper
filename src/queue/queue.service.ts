import { Injectable } from '@nestjs/common';
import { parseFile, shuffleArray } from 'src/scraper/external_functions';

@Injectable()
export class QueueService {
    itemFileContent = []
    QueueService: any;

    constructor() {
        this.itemFileContent = parseFile('./src/files/items.txt')
        shuffleArray(this.itemFileContent)
    }

    divideQueue(numOfElems){
        const originalArraySize = this.itemFileContent.length
        const chunkSize = originalArraySize / numOfElems
        const arrayOfArrays = []

        for (let i = 0; i < originalArraySize; i += chunkSize) {
            arrayOfArrays.push(this.itemFileContent.slice(i, i + chunkSize));
        }

        return arrayOfArrays
    }
}
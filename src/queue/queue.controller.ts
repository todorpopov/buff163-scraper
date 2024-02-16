import { Controller, Get } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
    constructor(private readonly queueService: QueueService) {}

    @Get()
    async queue(){
        await this.queueService.queue("154.9.33.92:8800")
    }
}

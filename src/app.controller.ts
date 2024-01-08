import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get("")
    homepage() {
        return { msg: "A NestJS web application that scrapes Buff163, a major CS:GO marketplace" }
    }
}

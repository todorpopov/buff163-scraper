import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get("")
    homepage() {
        return { msg: "A NestJS web application that scrapes Buff163, a major CS:GO marketplace" }
    }
}

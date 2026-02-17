import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Icd10Service } from './icd10.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('icd10')
@UseGuards(JwtAuthGuard)
export class Icd10Controller {
    constructor(private readonly icd10Service: Icd10Service) { }

    @Get()
    async search(@Query('search') search: string) {
        return this.icd10Service.search(search);
    }
}

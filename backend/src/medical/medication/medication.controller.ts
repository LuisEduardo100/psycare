import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('medications')
@UseGuards(JwtAuthGuard)
export class MedicationController {
    constructor(private readonly medicationService: MedicationService) { }

    @Get()
    findAll(@Query('q') query?: string) {
        if (query) {
            return this.medicationService.search(query);
        }
        return this.medicationService.findAll();
    }
}

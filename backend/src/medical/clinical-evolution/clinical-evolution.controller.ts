import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ClinicalEvolutionService } from './clinical-evolution.service';
import { CreateClinicalEvolutionDto } from './dto/create-clinical-evolution.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('clinical-evolutions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicalEvolutionController {
    constructor(private readonly service: ClinicalEvolutionService) { }

    /**
     * Create clinical evolution
     * RF-018: Clinical evolution notes
     */
    @Post()
    @Roles('DOCTOR')
    create(@Request() req, @Body() dto: CreateClinicalEvolutionDto) {
        return this.service.create(dto, req.user.userId);
    }

    /**
     * Get evolution by ID
     */
    @Get(':id')
    @Roles('DOCTOR')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    /**
     * Get evolutions for patient
     */
    @Get('patient/:patientId')
    @Roles('DOCTOR')
    findByPatient(
        @Param('patientId') patientId: string,
        @Query('limit') limit?: string,
        @Query('type') type?: string
    ) {
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.service.findByPatient(patientId, limitNum, type);
    }

    /**
     * Get important evolutions (timeline markers)
     */
    @Get('patient/:patientId/important')
    @Roles('DOCTOR')
    findImportantForPatient(@Param('patientId') patientId: string) {
        return this.service.findImportantForPatient(patientId);
    }

    /**
     * Get evolutions by consultation
     */
    @Get('consultation/:consultationId')
    @Roles('DOCTOR')
    findByConsultation(@Param('consultationId') consultationId: string) {
        return this.service.findByConsultation(consultationId);
    }
}

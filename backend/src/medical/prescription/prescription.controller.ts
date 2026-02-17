import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionController {
    constructor(private readonly prescriptionService: PrescriptionService) { }

    @Post()
    @Roles('DOCTOR')
    create(@Request() req, @Body() dto: CreatePrescriptionDto) {
        return this.prescriptionService.create(req.user.userId, dto);
    }

    @Get()
    @Roles('DOCTOR', 'PATIENT')
    findAll(@Request() req, @Query('patient_id') patientId?: string) {
        if (req.user.role === 'PATIENT') {
            return this.prescriptionService.findAllForUser(req.user.userId);
        }
        if (patientId) {
            return this.prescriptionService.findAllForPatient(patientId);
        }
        return [];
    }

    @Get(':id')
    @Roles('DOCTOR', 'PATIENT')
    findOne(@Param('id') id: string) {
        return this.prescriptionService.findOne(id);
    }

    @Delete(':id')
    @Roles('DOCTOR')
    deactivate(@Param('id') id: string) {
        return this.prescriptionService.deactivate(id);
    }
}

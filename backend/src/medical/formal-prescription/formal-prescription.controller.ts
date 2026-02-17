import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { FormalPrescriptionService } from './formal-prescription.service';
import { CreateFormalPrescriptionDto } from './dto/create-formal-prescription.dto';
import { RevokePrescriptionDto } from './dto/revoke-prescription.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('formal-prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormalPrescriptionController {
    constructor(private readonly service: FormalPrescriptionService) { }

    /**
     * Create formal prescription with cross-validation
     * RF-017: Formal prescription creation
     * RN-006: Medication vs diagnosis validation
     */
    @Post()
    @Roles('DOCTOR')
    create(@Request() req, @Body() dto: CreateFormalPrescriptionDto) {
        const doctorCrm = req.user.crm || 'UNKNOWN';
        return this.service.createFormalPrescription(dto, doctorCrm);
    }

    /**
     * Get prescription details
     */
    @Get(':id')
    @Roles('DOCTOR', 'PATIENT')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    /**
     * Get prescriptions for a patient
     */
    @Get('patient/:patientId')
    @Roles('DOCTOR')
    findByPatient(@Param('patientId') patientId: string) {
        return this.service.findByPatient(patientId);
    }

    /**
     * Revoke prescription with reason
     */
    @Post(':id/revoke')
    @Roles('DOCTOR', 'ADMIN')
    revoke(@Param('id') id: string, @Body() revokeDto: RevokePrescriptionDto) {
        return this.service.revokePrescription(id, revokeDto);
    }

    /**
     * Get PDF preparation data (optional/simulated)
     */
    @Get(':id/pdf-data')
    @Roles('DOCTOR')
    getPdfData(@Param('id') id: string) {
        return this.service.preparePdfData(id);
    }
}

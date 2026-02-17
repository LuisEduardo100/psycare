import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { TherapeuticPlanService } from './therapeutic-plan.service';
import { CreateTherapeuticPlanDto } from './dto/create-therapeutic-plan.dto';
import { UpdateTherapeuticPlanDto } from './dto/update-therapeutic-plan.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('therapeutic-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TherapeuticPlanController {
    constructor(private readonly service: TherapeuticPlanService) { }

    /**
     * Create therapeutic plan
     * RF-015: Therapeutic plan management
     */
    @Post()
    @Roles('DOCTOR')
    create(@Request() req, @Body() dto: CreateTherapeuticPlanDto) {
        return this.service.create(dto, req.user.userId);
    }

    /**
     * Get active plan for patient
     */
    @Get('patient/:patientId')
    @Roles('DOCTOR')
    findActiveForPatient(@Param('patientId') patientId: string) {
        return this.service.findActiveForPatient(patientId);
    }

    /**
     * Get patient's own plan
     */
    @Get('me/active')
    @Roles('PATIENT')
    findMyActivePlan(@Request() req) {
        return this.service.findActiveForUser(req.user.userId);
    }

    /**
     * Get patient history (Consultations + Plans)
     */
    @Get('patient/:patientId/history')
    @Roles('DOCTOR')
    async getHistory(@Param('patientId') patientId: string) {
        return this.service.getPatientHistory(patientId);
    }

    /**
     * Get plan by ID
     */
    @Get(':id')
    @Roles('DOCTOR')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    /**
     * Update therapeutic plan
     */
    @Patch(':id')
    @Roles('DOCTOR')
    update(@Param('id') id: string, @Body() dto: UpdateTherapeuticPlanDto) {
        return this.service.update(id, dto);
    }

    /**
     * Soft delete plan
     */
    @Delete(':id')
    @Roles('DOCTOR')
    delete(@Param('id') id: string, @Request() req) {
        return this.service.delete(id, req.user.userId);
    }
}

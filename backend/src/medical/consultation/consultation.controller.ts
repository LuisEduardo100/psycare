import { Body, Controller, Get, Param, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { CancelConsultationDto } from './dto/cancel-consultation.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationController {
    constructor(private readonly consultationService: ConsultationService) { }

    @Post()
    @Roles('DOCTOR')
    create(@Request() req, @Body() createConsultationDto: CreateConsultationDto) {
        return this.consultationService.create(req.user.userId, createConsultationDto);
    }

    @Get()
    @Roles('DOCTOR')
    findAll(@Request() req) {
        return this.consultationService.findAll(req.user.userId);
    }

    @Get('next')
    @Roles('PATIENT')
    findNext(@Request() req) {
        return this.consultationService.findNext(req.user.userId);
    }

    @Get(':id')
    @Roles('DOCTOR', 'PATIENT')
    findOne(@Param('id') id: string) {
        return this.consultationService.findOne(id);
    }

    /**
     * Update consultation draft
     * RN-016: Only DRAFT consultations can be edited
     */
    @Patch(':id')
    @Roles('DOCTOR')
    updateDraft(@Param('id') id: string, @Body() updateDto: UpdateConsultationDto) {
        return this.consultationService.updateDraft(id, updateDto);
    }

    /**
     * Legacy PUT endpoint - redirects to PATCH
     * @deprecated Use PATCH /consultations/:id instead
     */
    @Put(':id')
    @Roles('DOCTOR')
    update(@Param('id') id: string, @Body() updateDto: Partial<CreateConsultationDto>) {
        return this.consultationService.update(id, updateDto);
    }

    /**
     * Finalize consultation with validation and digital signature
     * RN-007: Required fields validation
     * RN-013: CID-10 format validation
     * RNF-005: Digital signature simulation
     */
    @Post(':id/finalize')
    @Roles('DOCTOR')
    async finalizeConsultation(@Param('id') id: string, @Request() req) {
        // Get doctor's CRM from user profile
        const doctorCrm = req.user.crm || 'UNKNOWN';
        return this.consultationService.finalizeConsultation(id, doctorCrm);
    }

    /**
     * Legacy finalize endpoint
     * @deprecated Use POST /consultations/:id/finalize instead
     */
    @Patch(':id/finalize')
    @Roles('DOCTOR')
    finalize(@Param('id') id: string) {
        return this.consultationService.finalize(id);
    }

    /**
     * Cancel consultation with mandatory reason
     * RN-016: Cancellation requires justification
     */
    @Post(':id/cancel')
    @Roles('DOCTOR', 'ADMIN')
    cancelConsultation(@Param('id') id: string, @Body() cancelDto: CancelConsultationDto) {
        return this.consultationService.cancelConsultation(id, cancelDto);
    }
}

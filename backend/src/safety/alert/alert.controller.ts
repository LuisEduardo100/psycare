import { Body, Controller, Get, Param, Patch, Query, UseGuards, Request } from '@nestjs/common';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertController {
    constructor(private readonly alertService: AlertService) { }

    @Get()
    @Roles('DOCTOR', 'SECRETARY')
    findAll(@Request() req, @Query('status') status?: string, @Query('severity') severity?: string) {
        return this.alertService.findAll({ status, severity, doctorId: req.user.userId });
    }

    @Get('stats')
    @Roles('DOCTOR', 'SECRETARY')
    getStats(@Request() req) {
        return this.alertService.getStats(req.user.userId);
    }

    @Get('patient/:patientId')
    @Roles('DOCTOR', 'SECRETARY')
    findByPatientId(@Param('patientId') patientId: string) {
        return this.alertService.findByPatientId(patientId);
    }

    @Get(':id')
    @Roles('DOCTOR', 'SECRETARY')
    findOne(@Param('id') id: string) {
        return this.alertService.findOne(id);
    }

    @Patch(':id/status')
    @Roles('DOCTOR', 'SECRETARY')
    updateStatus(
        @Param('id') id: string,
        @Body() body: { status: string, notes?: string, contact_method?: string }
    ) {
        return this.alertService.updateStatus(id, body.status, body.notes, body.contact_method);
    }
}

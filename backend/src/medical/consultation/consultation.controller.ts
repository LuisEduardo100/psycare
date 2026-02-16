import { Body, Controller, Get, Param, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
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
    @Roles('DOCTOR', 'PATIENT') // Patient might view their own (add ownership check in service)
    findOne(@Param('id') id: string) {
        return this.consultationService.findOne(id);
    }

    @Put(':id')
    @Roles('DOCTOR')
    update(@Param('id') id: string, @Body() updateDto: Partial<CreateConsultationDto>) {
        return this.consultationService.update(id, updateDto);
    }

    @Patch(':id/finalize')
    @Roles('DOCTOR')
    finalize(@Param('id') id: string) {
        return this.consultationService.finalize(id);
    }
}

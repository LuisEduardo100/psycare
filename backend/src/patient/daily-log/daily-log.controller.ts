import { Controller, Get, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { DailyLogService } from './daily-log.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('daily-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyLogController {
    constructor(private readonly dailyLogService: DailyLogService) { }

    @Post()
    @Roles('PATIENT')
    create(@Request() req, @Body() createDailyLogDto: CreateDailyLogDto) {
        return this.dailyLogService.create(req.user.userId, createDailyLogDto);
    }

    @Get()
    @Roles('PATIENT', 'DOCTOR')
    findAll(@Request() req) {
        return this.dailyLogService.findAll(req.user.userId);
    }

    @Get('today')
    @Roles('PATIENT')
    findToday(@Request() req) {
        return this.dailyLogService.findToday(req.user.userId);
    }

    @Get('doctor/recent')
    @Roles('DOCTOR')
    findRecentForDoctor(@Request() req, @Query('limit') limit?: string) {
        return this.dailyLogService.findRecentForDoctor(req.user.userId, limit ? parseInt(limit) : 20);
    }

    @Get('patient/:patientId')
    @Roles('DOCTOR')
    findByPatientId(@Param('patientId') patientId: string, @Query('limit') limit?: string) {
        return this.dailyLogService.findByPatientId(patientId, limit ? parseInt(limit) : 30);
    }
}

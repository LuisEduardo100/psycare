import { Module } from '@nestjs/common';
import { DailyLogController } from './daily-log/daily-log.controller';
import { DailyLogService } from './daily-log/daily-log.service';
import { DailyLogListener } from './daily-log/daily-log.listener';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DailyLogController],
    providers: [DailyLogService, DailyLogListener],
})
export class PatientModule { }

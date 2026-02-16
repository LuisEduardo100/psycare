import { Module } from '@nestjs/common';
import { DailyLogController } from './daily-log/daily-log.controller';
import { DailyLogService } from './daily-log/daily-log.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DailyLogController],
    providers: [DailyLogService],
})
export class PatientModule { }

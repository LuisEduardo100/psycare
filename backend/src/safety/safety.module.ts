import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertController } from './alert/alert.controller';
import { AlertService } from './alert/alert.service';

@Module({
    imports: [PrismaModule],
    controllers: [AlertController],
    providers: [AlertService],
})
export class SafetyModule { }

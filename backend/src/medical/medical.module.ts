import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConsultationController } from './consultation/consultation.controller';
import { ConsultationService } from './consultation/consultation.service';
import { MedicationController } from './medication/medication.controller';
import { MedicationService } from './medication/medication.service';

import { PrescriptionController } from './prescription/prescription.controller';
import { PrescriptionService } from './prescription/prescription.service';

@Module({
    imports: [PrismaModule],
    controllers: [ConsultationController, MedicationController, PrescriptionController],
    providers: [ConsultationService, MedicationService, PrescriptionService],
})
export class MedicalModule { }

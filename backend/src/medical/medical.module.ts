import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConsultationController } from './consultation/consultation.controller';
import { ConsultationService } from './consultation/consultation.service';
import { MedicationController } from './medication/medication.controller';
import { MedicationService } from './medication/medication.service';
import { PrescriptionController } from './prescription/prescription.controller';
import { PrescriptionService } from './prescription/prescription.service';
import { FormalPrescriptionController } from './formal-prescription/formal-prescription.controller';
import { FormalPrescriptionService } from './formal-prescription/formal-prescription.service';
import { TherapeuticPlanController } from './therapeutic-plan/therapeutic-plan.controller';
import { TherapeuticPlanService } from './therapeutic-plan/therapeutic-plan.service';
import { ClinicalEvolutionController } from './clinical-evolution/clinical-evolution.controller';
import { ClinicalEvolutionService } from './clinical-evolution/clinical-evolution.service';
import { Icd10Controller } from './icd10/icd10.controller';
import { Icd10Service } from './icd10/icd10.service';

@Module({
    imports: [PrismaModule],
    controllers: [
        ConsultationController,
        MedicationController,
        PrescriptionController,
        FormalPrescriptionController,
        TherapeuticPlanController,
        ClinicalEvolutionController,
        Icd10Controller,
    ],
    providers: [
        ConsultationService,
        MedicationService,
        PrescriptionService,
        FormalPrescriptionService,
        TherapeuticPlanService,
        ClinicalEvolutionService,
        Icd10Service,
    ],
})
export class MedicalModule { }

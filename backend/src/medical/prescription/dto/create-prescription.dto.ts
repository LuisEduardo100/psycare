import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePrescriptionDto {
    @IsUUID()
    patient_id: string;

    @IsUUID()
    medication_id: string;

    @IsString()
    dosage: string;

    @IsString()
    frequency: string;

    @IsDateString()
    start_date: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;
}

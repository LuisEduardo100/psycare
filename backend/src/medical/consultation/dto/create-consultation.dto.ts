import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum ConsultationModality {
    PRESENCIAL = 'PRESENCIAL',
    TELEMEDICINA = 'TELEMEDICINA',
}

export class CreateConsultationDto {
    @IsString()
    patient_id: string;

    @IsDateString()
    date_time: string;

    @IsInt()
    @Min(15)
    duration_minutes: number;

    @IsEnum(ConsultationModality)
    modality: ConsultationModality;

    @IsOptional()
    @IsString()
    @MinLength(10)
    anamnesis?: string;

    @IsOptional()
    @IsString()
    diagnostic_hypothesis?: string;

    @IsOptional()
    @IsString()
    treatment_plan?: string;

    // Future: ICD10 codes array validation
}

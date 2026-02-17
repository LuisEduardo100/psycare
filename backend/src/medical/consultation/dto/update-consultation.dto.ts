import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, IsArray } from 'class-validator';
import { ConsultationModality } from './create-consultation.dto';

export class UpdateConsultationDto {
    @IsOptional()
    @IsDateString()
    date_time?: string;

    @IsOptional()
    @IsInt()
    @Min(15)
    duration_minutes?: number;

    @IsOptional()
    @IsEnum(ConsultationModality)
    modality?: ConsultationModality;

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

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    icd10_codes?: string[];
}

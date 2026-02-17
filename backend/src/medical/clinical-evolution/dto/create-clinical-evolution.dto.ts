import { IsUUID, IsString, IsEnum, IsOptional, IsBoolean, MinLength } from 'class-validator';

export enum EvolutionType {
    NOTE = 'NOTE',
    PHONE_CALL = 'PHONE_CALL',
    CRISIS = 'CRISIS',
    MEDICATION_CHANGE = 'MEDICATION_CHANGE',
    HOSPITALIZATION = 'HOSPITALIZATION',
    FOLLOW_UP = 'FOLLOW_UP',
    EMERGENCY = 'EMERGENCY',
}

export class CreateClinicalEvolutionDto {
    @IsOptional()
    @IsUUID()
    consultation_id?: string;

    @IsUUID()
    patient_id: string;

    @IsEnum(EvolutionType)
    type: EvolutionType;

    @IsString()
    @MinLength(10, { message: 'Evolution content must be at least 10 characters' })
    content: string;

    @IsOptional()
    @IsBoolean()
    is_important_marker?: boolean;
}

import { IsUUID, IsString, IsEnum, IsArray, ValidateNested, IsOptional, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum PrescriptionType {
    SIMPLES = 'SIMPLES',
    CONTROLADA = 'CONTROLADA',
    ANTIMICROBIANA = 'ANTIMICROBIANA',
}

export class CreatePrescriptionItemDto {
    @IsUUID()
    medication_id: string;

    @IsString()
    @MinLength(3)
    dosage: string;

    @IsString()
    @MinLength(3)
    quantity: string; // "1 caixa", "30 comprimidos"

    @IsOptional()
    @IsString()
    instructions?: string;

    @IsOptional()
    @IsString()
    frequency?: string;

    @IsOptional()
    @IsString()
    form?: string;

    @IsOptional()
    @IsString()
    duration?: string;
}

export class CreateFormalPrescriptionDto {
    @IsUUID()
    consultation_id: string;

    @IsUUID()
    patient_id: string;

    @IsEnum(PrescriptionType)
    type: PrescriptionType;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePrescriptionItemDto)
    items: CreatePrescriptionItemDto[];
}

import { IsUUID, IsString, IsOptional, IsArray, ValidateNested, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum GoalStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    ACHIEVED = 'achieved',
    ABANDONED = 'abandoned',
}

export class TherapeuticGoalDto {
    @IsString()
    description: string;

    @IsOptional()
    @IsDateString()
    target_date?: string;

    @IsOptional()
    @IsEnum(GoalStatus)
    status?: GoalStatus;

    @IsOptional()
    @IsString()
    metrics?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateTherapeuticPlanDto {
    @IsUUID()
    patient_id: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TherapeuticGoalDto)
    short_term_goals?: TherapeuticGoalDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TherapeuticGoalDto)
    medium_term_goals?: TherapeuticGoalDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TherapeuticGoalDto)
    long_term_goals?: TherapeuticGoalDto[];

    @IsOptional()
    @IsString()
    strategies?: string;

    @IsOptional()
    @IsDateString()
    review_date?: string;
}

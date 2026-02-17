import { IsOptional, IsArray, ValidateNested, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { TherapeuticGoalDto } from './create-therapeutic-plan.dto';

export class UpdateTherapeuticPlanDto {
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

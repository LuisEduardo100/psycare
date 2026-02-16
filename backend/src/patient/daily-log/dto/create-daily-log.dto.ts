import { IsDateString, IsInt, IsOptional, IsString, Min, Max, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDailyLogDto {
    @IsDateString()
    date: string;

    // Sleep Module
    @IsOptional()
    @IsDateString()
    sleep_bedtime?: string;

    @IsOptional()
    @IsDateString()
    sleep_onset_time?: string;

    @IsOptional()
    @IsDateString()
    sleep_wake_time?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    sleep_quality?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    sleep_awakenings?: number;

    @IsOptional()
    @IsBoolean()
    sleep_difficulty?: boolean;

    // Mood Module (LCM)
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    mood_rating?: number; // 1-5 Emoji

    @IsOptional()
    @IsInt()
    @Min(-3)
    @Max(3)
    mood_level?: number; // -3 to +3

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(3)
    anxiety_level?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(3)
    irritability_level?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mood_tags?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    symptoms?: string[];

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsBoolean()
    suicidal_ideation_flag?: boolean;

    // Activity Module
    @IsOptional()
    @IsInt()
    @Min(0)
    exercise_minutes?: number;

    @IsOptional()
    @IsString()
    exercise_type?: string;

    @IsOptional()
    @IsString()
    exercise_intensity?: string;

    // Additional LCM Fields
    @IsOptional()
    sleep_hours?: number; // Can be float

    @IsOptional()
    @IsString()
    menstruation_stage?: string;

    @IsOptional()
    @IsString()
    life_event_description?: string;

    @IsOptional()
    @IsInt()
    @Min(-1)
    @Max(1)
    life_event_impact?: number;
}

import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GroupNameDto {
  @IsInt()
  @Min(1)
  groupId: number;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class GenerateTeamsDto {
  @IsInt()
  @Min(1)
  numberOfGroups: number;

  @IsInt()
  @Min(1)
  maxMembersPerGroup: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  names: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupNameDto)
  groupNames?: GroupNameDto[];
}

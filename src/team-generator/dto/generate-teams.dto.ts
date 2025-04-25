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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GroupNameDto {
  @ApiProperty({
    description: 'The ID of the group to rename (1-based)',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  groupId: number;

  @ApiProperty({
    description: 'The custom name for the group',
    example: 'Team Alpha',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class GenerateTeamsDto {
  @ApiProperty({
    description: 'Number of groups/teams to be generated',
    example: 3,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  numberOfGroups: number;

  @ApiProperty({
    description: 'Maximum number of members allowed per group',
    example: 5,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  maxMembersPerGroup: number;

  @ApiProperty({
    description: 'List of participant names to be assigned to groups',
    example: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  names: string[];

  @ApiPropertyOptional({
    description: 'Optional custom names for groups',
    example: [
      { groupId: 1, name: 'Team Alpha' },
      { groupId: 2, name: 'Team Beta' },
    ],
    type: [GroupNameDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupNameDto)
  groupNames?: GroupNameDto[];
}

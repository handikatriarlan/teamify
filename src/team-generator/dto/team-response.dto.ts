import { ApiProperty } from '@nestjs/swagger';

export class TeamMemberResponseDto {
  @ApiProperty({
    description: 'Name of the team member',
    example: 'Alice',
  })
  name: string;
}

export class TeamResponseDto {
  @ApiProperty({
    description: 'Name of the team',
    example: 'Team Alpha',
  })
  name: string;

  @ApiProperty({
    description: 'List of team members',
    type: [TeamMemberResponseDto],
  })
  members: TeamMemberResponseDto[];

  @ApiProperty({
    description: 'Size of the team (number of members)',
    example: 4,
  })
  size: number;
}

export class TeamGenerationResponseDto {
  @ApiProperty({
    description: 'List of generated teams',
    type: [TeamResponseDto],
  })
  teams: TeamResponseDto[];

  @ApiProperty({
    description: 'Total number of participants',
    example: 12,
  })
  totalParticipants: number;

  @ApiProperty({
    description: 'Total number of teams',
    example: 3,
  })
  totalTeams: number;

  @ApiProperty({
    description: 'Timestamp when teams were generated',
    example: '2023-07-15T10:30:00Z',
  })
  generatedAt: Date;

  @ApiProperty({
    description: 'Whether all teams have the same number of members',
    example: true,
  })
  isEvenDistribution: boolean;
}

export class CsvUploadResponseDto {
  @ApiProperty({
    description: 'List of unique names extracted from the CSV file',
    example: ['Alice', 'Bob', 'Charlie'],
  })
  names: string[];
}

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TeamGeneratorService } from './team-generator.service';
import { GenerateTeamsDto } from './dto/generate-teams.dto';

describe('TeamGeneratorService', () => {
  let service: TeamGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamGeneratorService],
    }).compile();

    service = module.get<TeamGeneratorService>(TeamGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate teams correctly', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 2,
      maxMembersPerGroup: 5,
      names: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'],
    };

    const result = service.generateTeams(dto);

    expect(result.teams.length).toBe(2);
    expect(result.totalParticipants).toBe(6);
    expect(result.totalTeams).toBe(2);
    expect(result.isEvenDistribution).toBe(true);

    // Check all names are distributed
    const allMembers = result.teams.flatMap((team) =>
      team.members.map((m) => m.name),
    );
    expect(allMembers.sort()).toEqual(
      ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'].sort(),
    );
  });

  it('should handle custom group names', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 2,
      maxMembersPerGroup: 5,
      names: ['Alice', 'Bob', 'Charlie', 'Dave'],
      groupNames: [
        { groupId: 1, name: 'Team Alpha' },
        { groupId: 2, name: 'Team Beta' },
      ],
    };

    const result = service.generateTeams(dto);

    expect(result.teams[0].name).toBe('Team Alpha');
    expect(result.teams[1].name).toBe('Team Beta');
  });

  it('should throw an error when not enough participants', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 5,
      maxMembersPerGroup: 2,
      names: ['Alice', 'Bob', 'Charlie'],
    };

    expect(() => service.generateTeams(dto)).toThrow(BadRequestException);
  });

  it('should throw an error when max members constraint is violated', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 2,
      maxMembersPerGroup: 2,
      names: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'],
    };

    expect(() => service.generateTeams(dto)).toThrow(BadRequestException);
  });

  it('should detect duplicate names', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 2,
      maxMembersPerGroup: 3,
      names: ['Alice', 'Bob', 'Alice', 'Dave'],
    };

    expect(() => service.generateTeams(dto)).toThrow(BadRequestException);
  });
});

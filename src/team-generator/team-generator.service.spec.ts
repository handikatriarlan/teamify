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

  it('should detect duplicate names', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 2,
      names: ['Alice', 'Bob', 'Alice', 'Dave'],
    };

    expect(() => service.generateTeams(dto)).toThrow(BadRequestException);
  });

  it('should properly shuffle and distribute locked groups', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 3,
      names: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan'],
      lockedGroups: [
        { names: ['Alice', 'Bob'] },
        { names: ['Charlie', 'Dave'] }
      ]
    };

    // Run the test multiple times to statistically verify proper randomization
    const groupDistribution = new Map<string, Set<number>>();
    const orderDistribution = {
      aliceBeforeBob: 0,
      bobBeforeAlice: 0,
      charlieBeforeDave: 0,
      daveBeforeCharlie: 0
    };
    
    // Track which group each locked pair was placed in
    for (let i = 0; i < 50; i++) {
      const result = service.generateTeams(dto);
      
      // Find which group each locked pair is in
      const aliceBobGroup = result.teams.findIndex(team => 
        team.members.some(m => m.name === 'Alice') && team.members.some(m => m.name === 'Bob')
      );
      
      const charlieDaveGroup = result.teams.findIndex(team => 
        team.members.some(m => m.name === 'Charlie') && team.members.some(m => m.name === 'Dave')
      );
      
      // Record this distribution
      if (!groupDistribution.has('AliceBob')) {
        groupDistribution.set('AliceBob', new Set<number>());
      }
      groupDistribution.get('AliceBob').add(aliceBobGroup);
      
      if (!groupDistribution.has('CharlieDave')) {
        groupDistribution.set('CharlieDave', new Set<number>());
      }
      groupDistribution.get('CharlieDave').add(charlieDaveGroup);
      
      // Track order of members within groups to verify internal shuffling
      const aliceTeam = result.teams[aliceBobGroup];
      const aliceIndex = aliceTeam.members.findIndex(m => m.name === 'Alice');
      const bobIndex = aliceTeam.members.findIndex(m => m.name === 'Bob');
      
      if (aliceIndex < bobIndex) {
        orderDistribution.aliceBeforeBob++;
      } else {
        orderDistribution.bobBeforeAlice++;
      }
      
      const charlieTeam = result.teams[charlieDaveGroup];
      const charlieIndex = charlieTeam.members.findIndex(m => m.name === 'Charlie');
      const daveIndex = charlieTeam.members.findIndex(m => m.name === 'Dave');
      
      if (charlieIndex < daveIndex) {
        orderDistribution.charlieBeforeDave++;
      } else {
        orderDistribution.daveBeforeCharlie++;
      }
    }
    
    // Verify that locked pairs were assigned to multiple different groups
    // This confirms proper shuffling - they should not always be in group 0
    expect(groupDistribution.get('AliceBob').size).toBeGreaterThan(1);
    expect(groupDistribution.get('CharlieDave').size).toBeGreaterThan(1);
    
    // Verify that members within locked groups are shuffled
    // Both orderings should occur with roughly similar frequency
    expect(orderDistribution.aliceBeforeBob).toBeGreaterThan(10);
    expect(orderDistribution.bobBeforeAlice).toBeGreaterThan(10);
    expect(orderDistribution.charlieBeforeDave).toBeGreaterThan(10);
    expect(orderDistribution.daveBeforeCharlie).toBeGreaterThan(10);
  });

  it('distributes participants when fewer than number of groups', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 5,
      names: ['Alice', 'Bob'], // Only 2 participants for 5 groups
    };

    const result = service.generateTeams(dto);
    
    // Verify that we get 5 groups as requested
    expect(result.teams.length).toBe(5);
    
    // Verify all participants are assigned
    const allMembers = result.teams.flatMap(team => team.members.map(m => m.name));
    expect(allMembers.sort()).toEqual(['Alice', 'Bob'].sort());
  });

  it('should throw an error when custom group sizes exceed available participants', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 2,
      names: ['Alice', 'Bob', 'Charlie'],
      customGroupSizes: [
        { groupId: 1, size: 2 },
        { groupId: 2, size: 2 }
      ] // Total required: 4, but only 3 participants available
    };

    expect(() => service.generateTeams(dto)).toThrow(BadRequestException);
  });

  it('should respect custom group sizes', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 3,
      names: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi'],
      customGroupSizes: [
        { groupId: 1, size: 3 },
        { groupId: 2, size: 2 },
        { groupId: 3, size: 3 }
      ]
    };

    const result = service.generateTeams(dto);

    // Verify each team has the exact size specified
    expect(result.teams[0].size).toBe(3);
    expect(result.teams[1].size).toBe(2);
    expect(result.teams[2].size).toBe(3);
  });

  it('should respect both custom group sizes and locked groups', () => {
    const dto: GenerateTeamsDto = {
      numberOfGroups: 3,
      names: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi'],
      customGroupSizes: [
        { groupId: 1, size: 3 },
        { groupId: 2, size: 2 },
        { groupId: 3, size: 3 }
      ],
      lockedGroups: [
        { names: ['Alice', 'Bob'] },
        { names: ['Charlie', 'Dave', 'Eve'] }
      ]
    };

    const result = service.generateTeams(dto);

    // Verify each team has the exact size specified
    expect(result.teams[0].size).toBe(3);
    expect(result.teams[1].size).toBe(2);
    expect(result.teams[2].size).toBe(3);

    // Find which team contains the Alice-Bob locked group
    const aliceBobTeamIndex = result.teams.findIndex(team => 
      team.members.some(m => m.name === 'Alice') && 
      team.members.some(m => m.name === 'Bob')
    );
    
    // Find which team contains the Charlie-Dave-Eve locked group
    const charlieDaveEveTeamIndex = result.teams.findIndex(team => 
      team.members.some(m => m.name === 'Charlie') && 
      team.members.some(m => m.name === 'Dave') &&
      team.members.some(m => m.name === 'Eve')
    );

    // Make sure locked groups are in the same team
    expect(aliceBobTeamIndex).not.toBe(-1);
    expect(charlieDaveEveTeamIndex).not.toBe(-1);

    // Make sure locked groups are in different teams (since they won't fit in one team)
    expect(aliceBobTeamIndex).not.toBe(charlieDaveEveTeamIndex);
  });
});

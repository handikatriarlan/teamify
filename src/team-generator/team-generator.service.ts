import { BadRequestException, Injectable } from '@nestjs/common';
import { GenerateTeamsDto } from './dto/generate-teams.dto';

export interface TeamMember {
  name: string;
}

export interface Team {
  name: string;
  members: TeamMember[];
}

export interface TeamGenerationResult {
  teams: Team[];
  totalParticipants: number;
  totalTeams: number;
  generatedAt: Date;
  isEvenDistribution: boolean;
}

@Injectable()
export class TeamGeneratorService {
  generateTeams(generateTeamsDto: GenerateTeamsDto): TeamGenerationResult {
    const { numberOfGroups, maxMembersPerGroup, names, groupNames } =
      generateTeamsDto;

    // Validate the input data
    this.validateTeamGeneration(names, numberOfGroups, maxMembersPerGroup);

    // Deduplicate names
    const uniqueNames = [...new Set(names)];

    // Check if we have duplicate names
    if (uniqueNames.length !== names.length) {
      throw new BadRequestException('Duplicate names are not allowed');
    }

    // Shuffle the names array
    const shuffledNames = this.shuffleArray([...uniqueNames]);

    // Calculate distribution
    const isEvenDistribution = shuffledNames.length % numberOfGroups === 0;
    const baseGroupSize = Math.floor(shuffledNames.length / numberOfGroups);
    const remainingMembers = shuffledNames.length % numberOfGroups;

    // Create teams
    const teams: Team[] = [];
    let currentNameIndex = 0;

    for (let i = 0; i < numberOfGroups; i++) {
      const customName = groupNames?.find((g) => g.groupId === i + 1)?.name;
      const teamName = customName || `Group ${i + 1}`;

      // Calculate how many members this team should have
      const teamSize = i < remainingMembers ? baseGroupSize + 1 : baseGroupSize;

      if (teamSize > maxMembersPerGroup) {
        throw new BadRequestException(
          `Group ${i + 1} exceeds the maximum members limit`,
        );
      }

      const teamMembers: TeamMember[] = shuffledNames
        .slice(currentNameIndex, currentNameIndex + teamSize)
        .map((name) => ({ name }));

      teams.push({
        name: teamName,
        members: teamMembers,
      });

      currentNameIndex += teamSize;
    }

    return {
      teams,
      totalParticipants: uniqueNames.length,
      totalTeams: teams.length,
      generatedAt: new Date(),
      isEvenDistribution,
    };
  }

  private validateTeamGeneration(
    names: string[],
    numberOfGroups: number,
    maxMembersPerGroup: number,
  ): void {
    // Ensure we have enough names to create the requested number of groups
    if (names.length < numberOfGroups) {
      throw new BadRequestException(
        `Not enough participants (${names.length}) to create ${numberOfGroups} groups`,
      );
    }

    // Check if the max members per group constraint is feasible
    const requiredGroups = Math.ceil(names.length / maxMembersPerGroup);
    if (requiredGroups > numberOfGroups) {
      throw new BadRequestException(
        `With ${names.length} participants and a maximum of ${maxMembersPerGroup} members per group, you need at least ${requiredGroups} groups`,
      );
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

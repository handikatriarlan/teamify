import { BadRequestException, Injectable } from '@nestjs/common';
import { GenerateTeamsDto } from './dto/generate-teams.dto';

export interface TeamMember {
  name: string;
}

export interface Team {
  name: string;
  members: TeamMember[];
  size: number;
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
    const { numberOfGroups, names, groupNames, customGroupSizes } = generateTeamsDto;

    // Deduplicate names
    const uniqueNames = [...new Set(names)];

    // Check if we have duplicate names
    if (uniqueNames.length !== names.length) {
      throw new BadRequestException('Duplicate names are not allowed');
    }

    // Validate and calculate group sizes
    const groupSizes = this.calculateGroupSizes(numberOfGroups, uniqueNames.length, customGroupSizes);
    
    // Shuffle the names array
    const shuffledNames = this.shuffleArray([...uniqueNames]);

    // Calculate if distribution is even
    const isEvenDistribution = groupSizes.every(size => size === groupSizes[0]);

    // Create teams
    const teams: Team[] = [];
    let currentNameIndex = 0;

    for (let i = 0; i < numberOfGroups; i++) {
      const customName = groupNames?.find(g => g.groupId === i + 1)?.name;
      const teamName = customName || `Group ${i + 1}`;
      
      // Get the size for this group
      const teamSize = groupSizes[i];
      
      const teamMembers: TeamMember[] = shuffledNames
        .slice(currentNameIndex, currentNameIndex + teamSize)
        .map(name => ({ name }));

      teams.push({
        name: teamName,
        members: teamMembers,
        size: teamMembers.length
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

  private calculateGroupSizes(
    numberOfGroups: number, 
    totalNames: number, 
    customGroupSizes?: { groupId: number; size: number }[]
  ): number[] {
    // If custom sizes are provided, use them
    if (customGroupSizes && customGroupSizes.length > 0) {
      // Validate that all groups have a defined size
      const providedGroupIds = customGroupSizes.map(g => g.groupId);
      for (let i = 1; i <= numberOfGroups; i++) {
        if (!providedGroupIds.includes(i)) {
          throw new BadRequestException(`Group ${i} is missing a custom size definition`);
        }
      }

      // Check if there are extra group definitions
      const invalidGroups = customGroupSizes.filter(g => g.groupId > numberOfGroups);
      if (invalidGroups.length > 0) {
        throw new BadRequestException(
          `Invalid group IDs found: ${invalidGroups.map(g => g.groupId).join(', ')}. Only ${numberOfGroups} groups were requested.`
        );
      }

      // Sort by group ID to ensure correct order
      const sortedSizes = [...customGroupSizes].sort((a, b) => a.groupId - b.groupId);
      
      // Get just the sizes
      const sizes = sortedSizes.map(g => g.size);
      
      // Validate each group has at least one member
      if (sizes.some(size => size < 1)) {
        throw new BadRequestException('Each group must have at least 1 member');
      }
      
      // Validate that the total size exactly matches the number of names
      const totalSize = sizes.reduce((sum, size) => sum + size, 0);
      if (totalSize !== totalNames) {
        throw new BadRequestException(
          `The sum of all custom group sizes (${totalSize}) must exactly match the number of participants (${totalNames})`
        );
      }
      
      return sizes;
    }
    
    // Otherwise, calculate even distribution
    const baseGroupSize = Math.floor(totalNames / numberOfGroups);
    const remainingMembers = totalNames % numberOfGroups;
    
    // Create an array of group sizes with remaining members distributed from start
    return Array(numberOfGroups).fill(0).map((_, index) => 
      index < remainingMembers ? baseGroupSize + 1 : baseGroupSize
    );
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

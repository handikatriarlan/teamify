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

    // Calculate group sizes with flexible distribution
    const groupSizes = this.calculateFlexibleGroupSizes(numberOfGroups, uniqueNames.length, customGroupSizes);
    
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

  private calculateFlexibleGroupSizes(
    numberOfGroups: number, 
    totalParticipants: number, 
    customGroupSizes?: { groupId: number; size: number }[]
  ): number[] {
    // Initialize array with zeros
    const groupSizes = Array(numberOfGroups).fill(0);
    
    // If no custom sizes provided, distribute evenly with randomized extras
    if (!customGroupSizes || customGroupSizes.length === 0) {
      const baseSize = Math.floor(totalParticipants / numberOfGroups);
      const remainder = totalParticipants % numberOfGroups;
      
      // Fill all groups with base size
      for (let i = 0; i < numberOfGroups; i++) {
        groupSizes[i] = baseSize;
      }
      
      // Randomize which groups get extra members
      if (remainder > 0) {
        // Create array of group indices and shuffle it
        const groupIndices = Array.from({ length: numberOfGroups }, (_, i) => i);
        this.shuffleArray(groupIndices);
        
        // Assign extra members to randomly selected groups
        for (let i = 0; i < remainder; i++) {
          groupSizes[groupIndices[i]]++;
        }
      }
      
      return groupSizes;
    }
    
    // Validate custom sizes
    const invalidGroups = customGroupSizes.filter(g => g.groupId < 1 || g.groupId > numberOfGroups);
    if (invalidGroups.length > 0) {
      throw new BadRequestException(
        `Invalid group IDs found: ${invalidGroups.map(g => g.groupId).join(', ')}. Group IDs must be between 1 and ${numberOfGroups}.`
      );
    }
    
    // Check for duplicates in group IDs
    const uniqueGroupIds = new Set(customGroupSizes.map(g => g.groupId));
    if (uniqueGroupIds.size !== customGroupSizes.length) {
      throw new BadRequestException('Duplicate group IDs found in custom sizes');
    }
    
    // Apply custom sizes
    let remainingParticipants = totalParticipants;
    const groupsWithoutCustomSize = new Set(Array.from({ length: numberOfGroups }, (_, i) => i + 1));
    
    for (const customSize of customGroupSizes) {
      const { groupId, size } = customSize;
      
      // Validate size is positive
      if (size < 1) {
        throw new BadRequestException(`Group ${groupId} must have at least 1 member`);
      }
      
      // Apply custom size
      groupSizes[groupId - 1] = size;
      remainingParticipants -= size;
      groupsWithoutCustomSize.delete(groupId);
    }
    
    // Validate remaining participants is enough for groups without custom size
    if (remainingParticipants < groupsWithoutCustomSize.size) {
      throw new BadRequestException(
        `Not enough participants remaining (${remainingParticipants}) to allocate at least 1 member to each of the ${groupsWithoutCustomSize.size} groups without custom sizes`
      );
    }
    
    // If remaining participants is negative, custom sizes exceed total participants
    if (remainingParticipants < 0) {
      throw new BadRequestException(
        `The sum of custom group sizes (${totalParticipants - remainingParticipants}) exceeds the total number of participants (${totalParticipants})`
      );
    }
    
    // Distribute remaining participants evenly among groups without custom size, with randomized extras
    if (groupsWithoutCustomSize.size > 0) {
      const baseSize = Math.floor(remainingParticipants / groupsWithoutCustomSize.size);
      const remainder = remainingParticipants % groupsWithoutCustomSize.size;
      
      // First assign base size to all groups without custom size
      for (const groupId of groupsWithoutCustomSize) {
        groupSizes[groupId - 1] = baseSize;
      }
      
      // Randomize which groups get the extra members
      if (remainder > 0) {
        // Convert Set to Array and shuffle
        const groupsArray = Array.from(groupsWithoutCustomSize);
        this.shuffleArray(groupsArray);
        
        // Assign extra members to randomly selected groups
        for (let i = 0; i < remainder; i++) {
          groupSizes[groupsArray[i] - 1]++;
        }
      }
    }
    
    return groupSizes;
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

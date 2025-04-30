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
    const { numberOfGroups, names, groupNames, customGroupSizes, lockedGroups } = generateTeamsDto;

    // Deduplicate names
    const uniqueNames = [...new Set(names)];

    // Check if we have duplicate names
    if (uniqueNames.length !== names.length) {
      throw new BadRequestException('Duplicate names are not allowed');
    }

    // Validate locked groups
    this.validateLockedGroups(uniqueNames, lockedGroups);

    // Calculate group sizes with flexible distribution
    const groupSizes = this.calculateFlexibleGroupSizes(numberOfGroups, uniqueNames.length, customGroupSizes);
    
    // Process locked groups and remaining names
    const { lockedSets, remainingNames } = this.processLockedGroups(uniqueNames, lockedGroups);

    // Assign locked groups and remaining names to teams
    const teams = this.assignToTeams(
      numberOfGroups, 
      groupSizes, 
      remainingNames, 
      lockedSets, 
      groupNames
    );

    // Calculate if distribution is even
    const isEvenDistribution = teams.every(team => team.size === teams[0].size);

    return {
      teams,
      totalParticipants: uniqueNames.length,
      totalTeams: teams.length,
      generatedAt: new Date(),
      isEvenDistribution,
    };
  }

  private validateLockedGroups(
    allNames: string[],
    lockedGroups?: { names: string[] }[]
  ): void {
    if (!lockedGroups || lockedGroups.length === 0) {
      return;
    }

    // Check that all names in locked groups exist in the main names list
    for (const group of lockedGroups) {
      for (const name of group.names) {
        if (!allNames.includes(name)) {
          throw new BadRequestException(`Name "${name}" in locked group is not in the main list of names`);
        }
      }
    }

    // Check that each name is only in one locked group
    const namesInLockedGroups = new Set<string>();
    for (const group of lockedGroups) {
      for (const name of group.names) {
        if (namesInLockedGroups.has(name)) {
          throw new BadRequestException(`Name "${name}" appears in multiple locked groups`);
        }
        namesInLockedGroups.add(name);
      }
    }

    // Validate that each locked group has at least 2 members
    for (const group of lockedGroups) {
      if (group.names.length < 2) {
        throw new BadRequestException('Each locked group must have at least 2 members');
      }
    }
  }

  private processLockedGroups(
    allNames: string[],
    lockedGroups?: { names: string[] }[]
  ): { lockedSets: string[][], remainingNames: string[] } {
    // If no locked groups, all names are available for random assignment
    if (!lockedGroups || lockedGroups.length === 0) {
      return {
        lockedSets: [],
        remainingNames: [...allNames]
      };
    }

    // Create locked sets
    const lockedSets = lockedGroups.map(group => [...group.names]);
    
    // Determine remaining names (not in any locked group)
    const namesInLockedGroups = new Set<string>();
    for (const group of lockedGroups) {
      for (const name of group.names) {
        namesInLockedGroups.add(name);
      }
    }

    const remainingNames = allNames.filter(name => !namesInLockedGroups.has(name));
    
    return { lockedSets, remainingNames };
  }

  private assignToTeams(
    numberOfGroups: number,
    groupSizes: number[],
    remainingNames: string[],
    lockedSets: string[][],
    groupNames?: { groupId: number, name: string }[]
  ): Team[] {
    // Initialize teams
    const teams: Team[] = [];
    for (let i = 0; i < numberOfGroups; i++) {
      const customName = groupNames?.find(g => g.groupId === i + 1)?.name;
      teams.push({
        name: customName || `Group ${i + 1}`,
        members: [],
        size: 0
      });
    }

    // Shuffle remaining names and locked sets for randomness
    const shuffledNames = this.shuffleArray([...remainingNames]);
    const shuffledLockedSets = this.shuffleArray([...lockedSets]);
    
    // Sort locked sets by size (largest first) to optimize placement
    shuffledLockedSets.sort((a, b) => b.length - a.length);

    // First, place locked sets in teams
    for (const lockedSet of shuffledLockedSets) {
      const lockedSetSize = lockedSet.length;
      
      // Find team with most available space
      let bestTeamIndex = 0;
      let bestAvailableSpace = -1;
      
      for (let i = 0; i < teams.length; i++) {
        const currentSize = teams[i].members.length;
        const targetSize = groupSizes[i];
        const availableSpace = targetSize - currentSize;
        
        // If this team has enough space and more than previous best
        if (availableSpace >= lockedSetSize && availableSpace > bestAvailableSpace) {
          bestTeamIndex = i;
          bestAvailableSpace = availableSpace;
        }
      }
      
      // If no team has enough space, we need to adjust group sizes
      if (bestAvailableSpace < lockedSetSize) {
        throw new BadRequestException(
          `Unable to place locked group of size ${lockedSetSize} in any team. Consider increasing team sizes or reducing locked group constraints.`
        );
      }
      
      // Add locked set to the best team
      for (const name of lockedSet) {
        teams[bestTeamIndex].members.push({ name });
      }
      teams[bestTeamIndex].size = teams[bestTeamIndex].members.length;
    }
    
    // Now distribute remaining names
    // For each group, fill up to its target size
    let nameIndex = 0;
    
    for (let i = 0; i < teams.length; i++) {
      const targetSize = groupSizes[i];
      
      // Fill team up to its target size
      while (teams[i].members.length < targetSize && nameIndex < shuffledNames.length) {
        teams[i].members.push({ name: shuffledNames[nameIndex] });
        nameIndex++;
      }
      
      teams[i].size = teams[i].members.length;
    }
    
    return teams;
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

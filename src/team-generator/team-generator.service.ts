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
    // Initialize teams and track available space for each team
    const teams: Team[] = [];
    const availableSpaces: number[] = [...groupSizes];
    
    for (let i = 0; i < numberOfGroups; i++) {
      const customName = groupNames?.find(g => g.groupId === i + 1)?.name;
      teams.push({
        name: customName || `Group ${i + 1}`,
        members: [],
        size: 0
      });
    }

    // Create a shuffled order of team indices for initial placement
    const teamIndices = Array.from({ length: numberOfGroups }, (_, i) => i);
    this.shuffleArray(teamIndices);

    // Shuffle remaining names and locked sets for randomness
    const shuffledNames = this.shuffleArray([...remainingNames]);
    const shuffledLockedSets = this.shuffleArray([...lockedSets]);
    
    // Sort locked sets by size (largest first) to optimize placement
    shuffledLockedSets.sort((a, b) => b.length - a.length);

    // Track which team each locked member is assigned to
    const memberTeamAssignments = new Map<string, number>();

    // First, place locked sets in teams
    for (const lockedSet of shuffledLockedSets) {
      const lockedSetSize = lockedSet.length;
      
      // Find suitable teams in random order
      const suitableTeams = [];
      
      for (const teamIdx of teamIndices) {
        // If this team has enough available space
        if (availableSpaces[teamIdx] >= lockedSetSize) {
          suitableTeams.push({ 
            index: teamIdx, 
            availableSpace: availableSpaces[teamIdx]
          });
        }
      }
      
      // If no team has enough space, throw an exception
      if (suitableTeams.length === 0) {
        throw new BadRequestException(
          `Unable to place locked group of size ${lockedSetSize} in any team. Consider increasing team sizes or reducing locked group constraints.`
        );
      }
      
      // Randomly select one of the suitable teams
      this.shuffleArray(suitableTeams);
      const bestTeamIndex = suitableTeams[0].index;
      
      // Reduce available space for the selected team
      availableSpaces[bestTeamIndex] -= lockedSetSize;
      
      // Track which team each locked member is assigned to
      for (const name of lockedSet) {
        memberTeamAssignments.set(name, bestTeamIndex);
      }
    }
    
    // Create arrays of member names for each team (without adding them yet)
    const teamMemberNames: string[][] = Array(numberOfGroups).fill(null).map(() => []);
    
    // Add locked members to their assigned team's member names array
    for (const [name, teamIndex] of memberTeamAssignments.entries()) {
      teamMemberNames[teamIndex].push(name);
    }
    
    // Now distribute remaining names - respecting available space
    let nameIndex = 0;
    
    // First shuffle teams to randomize the order in which we fill teams
    const shuffledTeamIndices = [...teamIndices];
    this.shuffleArray(shuffledTeamIndices);
    
    // Keep assigning names while we have names left and space available in any team
    while (nameIndex < shuffledNames.length) {
      let assignedThisRound = false;
      
      // Try to assign to teams with available space
      for (const i of shuffledTeamIndices) {
        if (availableSpaces[i] > 0 && nameIndex < shuffledNames.length) {
          teamMemberNames[i].push(shuffledNames[nameIndex]);
          availableSpaces[i]--;
          nameIndex++;
          assignedThisRound = true;
        }
      }
      
      // If we couldn't assign any name this round, we're done
      if (!assignedThisRound) {
        break;
      }
    }
    
    // Shuffle each team's member names and create the final members array
    for (let i = 0; i < teams.length; i++) {
      const shuffledTeamMembers = this.shuffleArray(teamMemberNames[i]);
      teams[i].members = shuffledTeamMembers.map(name => ({ name }));
      teams[i].size = teams[i].members.length;
    }
    
    // Check if there are unassigned names due to strict size enforcement
    if (nameIndex < shuffledNames.length) {
      throw new BadRequestException(
        `Unable to assign all participants to teams due to strict size constraints. ${shuffledNames.length - nameIndex} participant(s) could not be assigned. Consider increasing team sizes.`
      );
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

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
  message?: string;
}

@Injectable()
export class TeamGeneratorService {
  generateTeams(generateTeamsDto: GenerateTeamsDto): TeamGenerationResult {
    const {
      numberOfGroups,
      names,
      groupNames,
      customGroupSizes,
      lockedGroups,
    } = generateTeamsDto;

    // Validate input names array
    if (!names || names.length === 0) {
      throw new BadRequestException({
        message: 'No participant names provided',
        errors: ['Please provide at least one participant name'],
      });
    }

    // Validate number of groups
    if (numberOfGroups <= 0) {
      throw new BadRequestException({
        message: 'Invalid number of groups',
        errors: ['Number of groups must be at least 1'],
      });
    }

    // Check if there are enough names to create at least one team
    if (names.length < numberOfGroups) {
      throw new BadRequestException({
        message: 'Insufficient participants',
        errors: [
          `Cannot create ${numberOfGroups} groups with only ${names.length} participants. Each group must have at least 1 member.`,
        ],
      });
    }

    // Deduplicate names
    const uniqueNames = [
      ...new Set(
        names
          .filter((name) => name && name.trim() !== '')
          .map((name) => name.trim()),
      ),
    ];

    if (uniqueNames.length < numberOfGroups) {
      throw new BadRequestException({
        message: 'Insufficient unique participants',
        errors: [
          `After removing duplicates and empty names, only ${uniqueNames.length} unique participants remain. Cannot create ${numberOfGroups} groups.`,
        ],
      });
    }

    // Validate group names if provided
    if (groupNames) {
      const invalidGroupIds = groupNames.filter(
        (g) => g.groupId < 1 || g.groupId > numberOfGroups,
      );
      if (invalidGroupIds.length > 0) {
        throw new BadRequestException({
          message: 'Invalid group IDs found in group names',
          errors: [
            `Group IDs must be between 1 and ${numberOfGroups}. Found invalid IDs: ${invalidGroupIds.map((g) => g.groupId).join(', ')}`,
          ],
        });
      }

      // Check for duplicates in group IDs
      const uniqueGroupIds = new Set(groupNames.map((g) => g.groupId));
      if (uniqueGroupIds.size !== groupNames.length) {
        throw new BadRequestException({
          message: 'Duplicate group IDs found in group names',
          errors: ['Each group ID must be unique'],
        });
      }

      // Check for empty group names
      const emptyNames = groupNames.filter(
        (g) => !g.name || g.name.trim() === '',
      );
      if (emptyNames.length > 0) {
        throw new BadRequestException({
          message: 'Empty group names are not allowed',
          errors: [`Group ID ${emptyNames[0].groupId} has an empty name`],
        });
      }
    }

    // Validate locked groups
    this.validateLockedGroups(uniqueNames, lockedGroups);

    // Calculate group sizes with flexible distribution
    const groupSizes = this.calculateFlexibleGroupSizes(
      numberOfGroups,
      uniqueNames.length,
      customGroupSizes,
    );

    // Process locked groups and remaining names
    const { lockedSets, remainingNames } = this.processLockedGroups(
      uniqueNames,
      lockedGroups,
    );

    // Assign locked groups and remaining names to teams
    const teams = this.assignToTeams(
      numberOfGroups,
      groupSizes,
      remainingNames,
      lockedSets,
      groupNames,
    );

    // Calculate if distribution is even
    const isEvenDistribution = teams.every(
      (team) => team.size === teams[0].size,
    );

    let message = `Successfully generated ${teams.length} teams with ${uniqueNames.length} participants`;
    if (isEvenDistribution) {
      message += `, with even distribution (${teams[0].size} members per team)`;
    } else {
      const minSize = Math.min(...teams.map((t) => t.size));
      const maxSize = Math.max(...teams.map((t) => t.size));
      message += `, with sizes ranging from ${minSize} to ${maxSize} members per team`;
    }

    return {
      teams,
      totalParticipants: uniqueNames.length,
      totalTeams: teams.length,
      generatedAt: new Date(),
      isEvenDistribution,
      message,
    };
  }

  private validateLockedGroups(
    allNames: string[],
    lockedGroups?: { names: string[] }[],
  ): void {
    if (!lockedGroups || lockedGroups.length === 0) {
      return;
    }

    // Check for empty locked groups
    const emptyGroups = lockedGroups.filter(
      (g) => !g.names || g.names.length === 0,
    );
    if (emptyGroups.length > 0) {
      throw new BadRequestException(
        'Empty locked groups are not allowed. Each locked group must contain at least 2 names.',
      );
    }

    // Check that all names in locked groups exist in the main names list
    for (const group of lockedGroups) {
      for (const name of group.names) {
        if (!allNames.includes(name)) {
          throw new BadRequestException(
            `Name "${name}" in locked group is not in the main list of names`,
          );
        }
      }
    }

    // Check that each name is only in one locked group
    const namesInLockedGroups = new Map<string, number>();
    for (let i = 0; i < lockedGroups.length; i++) {
      const group = lockedGroups[i];
      for (const name of group.names) {
        if (namesInLockedGroups.has(name)) {
          const previousGroupIndex = namesInLockedGroups.get(name);
          throw new BadRequestException(
            `Name "${name}" appears in multiple locked groups (group ${previousGroupIndex + 1} and ${i + 1}). Names can only be locked in one group.`,
          );
        }
        namesInLockedGroups.set(name, i);
      }
    }

    // Validate that each locked group has at least 2 members
    for (let i = 0; i < lockedGroups.length; i++) {
      const group = lockedGroups[i];
      if (group.names.length < 2) {
        throw new BadRequestException(
          `Locked group ${i + 1} must have at least 2 members. Found only ${group.names.length} member(s).`,
        );
      }
    }

    // Check if any locked group is larger than the total number of participants divided by number of groups
    const largestLockedGroup = Math.max(
      ...lockedGroups.map((g) => g.names.length),
    );
    const averageGroupSize = Math.ceil(allNames.length / lockedGroups.length);
    if (largestLockedGroup > averageGroupSize * 2) {
      throw new BadRequestException(
        `Locked group with ${largestLockedGroup} members is too large compared to the average group size (${averageGroupSize}). Consider reducing the size of locked groups or increasing the total number of participants.`,
      );
    }
  }

  private processLockedGroups(
    allNames: string[],
    lockedGroups?: { names: string[] }[],
  ): { lockedSets: string[][]; remainingNames: string[] } {
    // If no locked groups, all names are available for random assignment
    if (!lockedGroups || lockedGroups.length === 0) {
      return {
        lockedSets: [],
        remainingNames: [...allNames],
      };
    }

    // Create locked sets
    const lockedSets = lockedGroups.map((group) => [...group.names]);

    // Determine remaining names (not in any locked group)
    const namesInLockedGroups = new Set<string>();
    for (const group of lockedGroups) {
      for (const name of group.names) {
        namesInLockedGroups.add(name);
      }
    }

    const remainingNames = allNames.filter(
      (name) => !namesInLockedGroups.has(name),
    );

    return { lockedSets, remainingNames };
  }

  private assignToTeams(
    numberOfGroups: number,
    groupSizes: number[],
    remainingNames: string[],
    lockedSets: string[][],
    groupNames?: { groupId: number; name: string }[],
  ): Team[] {
    // Validate group sizes sum is equal to total participants
    const totalSize = groupSizes.reduce((sum, size) => sum + size, 0);
    const totalParticipants = remainingNames.length + lockedSets.flat().length;

    if (totalSize !== totalParticipants) {
      throw new BadRequestException(
        `Internal error: Group sizes total (${totalSize}) doesn't match total participants (${totalParticipants}). Please report this issue.`,
      );
    }

    // Initialize teams and track available space for each team
    const teams: Team[] = [];
    const availableSpaces: number[] = [...groupSizes];

    for (let i = 0; i < numberOfGroups; i++) {
      const customName = groupNames?.find((g) => g.groupId === i + 1)?.name;
      teams.push({
        name: customName || `Group ${i + 1}`,
        members: [],
        size: 0,
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
            availableSpace: availableSpaces[teamIdx],
          });
        }
      }

      // If no team has enough space, throw an exception
      if (suitableTeams.length === 0) {
        throw new BadRequestException(
          `Unable to place locked group of size ${lockedSetSize} (members: ${lockedSet.join(', ')}) in any team. Consider increasing team sizes or reducing locked group constraints.`,
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
    const teamMemberNames: string[][] = Array(numberOfGroups)
      .fill(null)
      .map(() => []);

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
      teams[i].members = shuffledTeamMembers.map((name) => ({ name }));
      teams[i].size = teams[i].members.length;
    }

    // Check if there are unassigned names due to strict size enforcement
    if (nameIndex < shuffledNames.length) {
      const unassignedNames = shuffledNames.slice(nameIndex);
      throw new BadRequestException(
        `Unable to assign all participants to teams due to strict size constraints. ${unassignedNames.length} participant(s) could not be assigned: ${unassignedNames.join(', ')}. Consider increasing team sizes.`,
      );
    }

    return teams;
  }

  private calculateFlexibleGroupSizes(
    numberOfGroups: number,
    totalParticipants: number,
    customGroupSizes?: { groupId: number; size: number }[],
  ): number[] {
    // If no custom sizes are provided, distribute evenly
    if (!customGroupSizes || customGroupSizes.length === 0) {
      return this.calculateEvenGroupSizes(numberOfGroups, totalParticipants);
    }

    // Validate custom sizes
    const invalidGroups = customGroupSizes.filter(
      (g) => g.groupId < 1 || g.groupId > numberOfGroups,
    );
    if (invalidGroups.length > 0) {
      throw new BadRequestException({
        message: 'Invalid group IDs found in custom group sizes',
        errors: [
          `Group IDs must be between 1 and ${numberOfGroups}. Found invalid IDs: ${invalidGroups.map((g) => g.groupId).join(', ')}`,
        ],
      });
    }

    // Check for duplicate group IDs
    const groupIdOccurrences = new Map<number, number>();
    for (const { groupId } of customGroupSizes) {
      groupIdOccurrences.set(
        groupId,
        (groupIdOccurrences.get(groupId) || 0) + 1,
      );
    }

    const duplicates = Array.from(groupIdOccurrences.entries()).filter(
      ([_, count]) => count > 1,
    );

    if (duplicates.length > 0) {
      const duplicateIds = duplicates.map(([id, _]) => id);

      throw new BadRequestException({
        message: 'Duplicate group IDs found in custom group sizes',
        errors: ['Each group ID must be unique'],
      });
    }

    // Initialize result array with default value of 0
    const groupSizes = Array(numberOfGroups).fill(0);

    // Track groups with custom size
    const groupsWithCustomSize = new Set<number>();
    let definedSizeTotal = 0;

    // Apply custom sizes
    for (const { groupId, size } of customGroupSizes) {
      // Adjust to 0-based index
      const index = groupId - 1;

      // Validate size is positive
      if (size < 1) {
        throw new BadRequestException({
          message: 'Invalid group sizes found',
          errors: [
            `Group sizes must be at least 1. Found invalid sizes for groups: ${groupId}`,
          ],
        });
      }

      // Validate size is reasonable
      if (size > totalParticipants - (numberOfGroups - 1)) {
        throw new BadRequestException({
          message: 'Group size too large',
          errors: [
            `Group ${groupId} size (${size}) is too large. Maximum reasonable size would be ${totalParticipants - (numberOfGroups - 1)} to allow at least one member for each other group.`,
          ],
        });
      }

      // Set the custom size
      groupSizes[index] = size;
      groupsWithCustomSize.add(index);
      definedSizeTotal += size;
    }

    // Create set of groups without custom size
    const groupsWithoutCustomSize = new Set<number>();
    for (let i = 0; i < numberOfGroups; i++) {
      if (!groupsWithCustomSize.has(i)) {
        groupsWithoutCustomSize.add(i);
      }
    }

    // Calculate remaining participants to distribute
    const remainingParticipants = totalParticipants - definedSizeTotal;

    // Validate remaining participants is enough for groups without custom size
    if (remainingParticipants < groupsWithoutCustomSize.size) {
      throw new BadRequestException({
        message: 'Not enough participants remaining',
        errors: [
          `Not enough participants remaining (${remainingParticipants}) to allocate at least 1 member to each of the ${groupsWithoutCustomSize.size} groups without custom sizes. Please reduce custom group sizes or increase the number of participants.`,
        ],
      });
    }

    // If remaining participants is negative, custom sizes exceed total participants
    if (remainingParticipants < 0) {
      throw new BadRequestException({
        message: 'Total custom sizes exceed available participants',
        errors: [
          `The sum of custom group sizes (${definedSizeTotal}) exceeds the total number of participants (${totalParticipants}). Please reduce custom group sizes.`,
        ],
      });
    }

    // Distribute remaining participants evenly among groups without custom size
    this.distributeEvenly(
      groupSizes,
      remainingParticipants,
      groupsWithoutCustomSize,
    );

    return groupSizes;
  }

  private calculateEvenGroupSizes(
    numberOfGroups: number,
    totalParticipants: number,
  ): number[] {
    const baseSize = Math.floor(totalParticipants / numberOfGroups);
    const remainder = totalParticipants % numberOfGroups;

    const groupSizes = Array(numberOfGroups).fill(baseSize);

    if (remainder > 0) {
      const groupIndices = Array.from({ length: numberOfGroups }, (_, i) => i);
      this.shuffleArray(groupIndices);

      for (let i = 0; i < remainder; i++) {
        groupSizes[groupIndices[i]]++;
      }
    }

    return groupSizes;
  }

  private distributeEvenly(
    groupSizes: number[],
    remainingParticipants: number,
    groupsWithoutCustomSize: Set<number>,
  ): void {
    const baseSize = Math.floor(
      remainingParticipants / groupsWithoutCustomSize.size,
    );
    const remainder = remainingParticipants % groupsWithoutCustomSize.size;

    for (const groupId of groupsWithoutCustomSize) {
      groupSizes[groupId] = baseSize;
    }

    if (remainder > 0) {
      const groupsArray = Array.from(groupsWithoutCustomSize);
      this.shuffleArray(groupsArray);

      for (let i = 0; i < remainder; i++) {
        groupSizes[groupsArray[i]]++;
      }
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

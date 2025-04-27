"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamGeneratorService = void 0;
const common_1 = require("@nestjs/common");
let TeamGeneratorService = class TeamGeneratorService {
    generateTeams(generateTeamsDto) {
        const { numberOfGroups, names, groupNames, customGroupSizes } = generateTeamsDto;
        const uniqueNames = [...new Set(names)];
        if (uniqueNames.length !== names.length) {
            throw new common_1.BadRequestException('Duplicate names are not allowed');
        }
        const groupSizes = this.calculateFlexibleGroupSizes(numberOfGroups, uniqueNames.length, customGroupSizes);
        const shuffledNames = this.shuffleArray([...uniqueNames]);
        const isEvenDistribution = groupSizes.every(size => size === groupSizes[0]);
        const teams = [];
        let currentNameIndex = 0;
        for (let i = 0; i < numberOfGroups; i++) {
            const customName = groupNames?.find(g => g.groupId === i + 1)?.name;
            const teamName = customName || `Group ${i + 1}`;
            const teamSize = groupSizes[i];
            const teamMembers = shuffledNames
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
    calculateFlexibleGroupSizes(numberOfGroups, totalParticipants, customGroupSizes) {
        const groupSizes = Array(numberOfGroups).fill(0);
        if (!customGroupSizes || customGroupSizes.length === 0) {
            const baseSize = Math.floor(totalParticipants / numberOfGroups);
            const remainder = totalParticipants % numberOfGroups;
            for (let i = 0; i < numberOfGroups; i++) {
                groupSizes[i] = baseSize;
            }
            if (remainder > 0) {
                const groupIndices = Array.from({ length: numberOfGroups }, (_, i) => i);
                this.shuffleArray(groupIndices);
                for (let i = 0; i < remainder; i++) {
                    groupSizes[groupIndices[i]]++;
                }
            }
            return groupSizes;
        }
        const invalidGroups = customGroupSizes.filter(g => g.groupId < 1 || g.groupId > numberOfGroups);
        if (invalidGroups.length > 0) {
            throw new common_1.BadRequestException(`Invalid group IDs found: ${invalidGroups.map(g => g.groupId).join(', ')}. Group IDs must be between 1 and ${numberOfGroups}.`);
        }
        const uniqueGroupIds = new Set(customGroupSizes.map(g => g.groupId));
        if (uniqueGroupIds.size !== customGroupSizes.length) {
            throw new common_1.BadRequestException('Duplicate group IDs found in custom sizes');
        }
        let remainingParticipants = totalParticipants;
        const groupsWithoutCustomSize = new Set(Array.from({ length: numberOfGroups }, (_, i) => i + 1));
        for (const customSize of customGroupSizes) {
            const { groupId, size } = customSize;
            if (size < 1) {
                throw new common_1.BadRequestException(`Group ${groupId} must have at least 1 member`);
            }
            groupSizes[groupId - 1] = size;
            remainingParticipants -= size;
            groupsWithoutCustomSize.delete(groupId);
        }
        if (remainingParticipants < groupsWithoutCustomSize.size) {
            throw new common_1.BadRequestException(`Not enough participants remaining (${remainingParticipants}) to allocate at least 1 member to each of the ${groupsWithoutCustomSize.size} groups without custom sizes`);
        }
        if (remainingParticipants < 0) {
            throw new common_1.BadRequestException(`The sum of custom group sizes (${totalParticipants - remainingParticipants}) exceeds the total number of participants (${totalParticipants})`);
        }
        if (groupsWithoutCustomSize.size > 0) {
            const baseSize = Math.floor(remainingParticipants / groupsWithoutCustomSize.size);
            const remainder = remainingParticipants % groupsWithoutCustomSize.size;
            for (const groupId of groupsWithoutCustomSize) {
                groupSizes[groupId - 1] = baseSize;
            }
            if (remainder > 0) {
                const groupsArray = Array.from(groupsWithoutCustomSize);
                this.shuffleArray(groupsArray);
                for (let i = 0; i < remainder; i++) {
                    groupSizes[groupsArray[i] - 1]++;
                }
            }
        }
        return groupSizes;
    }
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};
exports.TeamGeneratorService = TeamGeneratorService;
exports.TeamGeneratorService = TeamGeneratorService = __decorate([
    (0, common_1.Injectable)()
], TeamGeneratorService);
//# sourceMappingURL=team-generator.service.js.map
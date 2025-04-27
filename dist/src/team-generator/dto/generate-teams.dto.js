"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateTeamsDto = exports.GroupSizeDto = exports.GroupNameDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class GroupNameDto {
}
exports.GroupNameDto = GroupNameDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The ID of the group to rename (1-based)',
        example: 1,
        minimum: 1,
        type: Number,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GroupNameDto.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The custom name for the group',
        example: 'Team Alpha',
        type: String,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GroupNameDto.prototype, "name", void 0);
class GroupSizeDto {
}
exports.GroupSizeDto = GroupSizeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The ID of the group (1-based)',
        example: 1,
        minimum: 1,
        type: Number,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GroupSizeDto.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The desired size for this group',
        example: 5,
        minimum: 1,
        type: Number,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GroupSizeDto.prototype, "size", void 0);
class GenerateTeamsDto {
}
exports.GenerateTeamsDto = GenerateTeamsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of groups/teams to be generated',
        example: 3,
        minimum: 1,
        type: Number,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GenerateTeamsDto.prototype, "numberOfGroups", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of participant names to be assigned to groups',
        example: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'],
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsNotEmpty)({ each: true }),
    __metadata("design:type", Array)
], GenerateTeamsDto.prototype, "names", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional custom names for groups',
        example: [
            { groupId: 1, name: 'Team Alpha' },
            { groupId: 2, name: 'Team Beta' },
        ],
        type: [GroupNameDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => GroupNameDto),
    __metadata("design:type", Array)
], GenerateTeamsDto.prototype, "groupNames", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional custom sizes for specific groups. Groups without specified sizes will have remaining participants distributed evenly among them.',
        example: [
            { groupId: 1, size: 4 },
            { groupId: 3, size: 5 },
        ],
        type: [GroupSizeDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => GroupSizeDto),
    __metadata("design:type", Array)
], GenerateTeamsDto.prototype, "customGroupSizes", void 0);
//# sourceMappingURL=generate-teams.dto.js.map
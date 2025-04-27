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
exports.CsvUploadResponseDto = exports.TeamGenerationResponseDto = exports.TeamResponseDto = exports.TeamMemberResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class TeamMemberResponseDto {
}
exports.TeamMemberResponseDto = TeamMemberResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Name of the team member',
        example: 'Alice',
    }),
    __metadata("design:type", String)
], TeamMemberResponseDto.prototype, "name", void 0);
class TeamResponseDto {
}
exports.TeamResponseDto = TeamResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Name of the team',
        example: 'Team Alpha',
    }),
    __metadata("design:type", String)
], TeamResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of team members',
        type: [TeamMemberResponseDto],
    }),
    __metadata("design:type", Array)
], TeamResponseDto.prototype, "members", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Size of the team (number of members)',
        example: 4,
    }),
    __metadata("design:type", Number)
], TeamResponseDto.prototype, "size", void 0);
class TeamGenerationResponseDto {
}
exports.TeamGenerationResponseDto = TeamGenerationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of generated teams',
        type: [TeamResponseDto],
    }),
    __metadata("design:type", Array)
], TeamGenerationResponseDto.prototype, "teams", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of participants',
        example: 12,
    }),
    __metadata("design:type", Number)
], TeamGenerationResponseDto.prototype, "totalParticipants", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of teams',
        example: 3,
    }),
    __metadata("design:type", Number)
], TeamGenerationResponseDto.prototype, "totalTeams", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp when teams were generated',
        example: '2023-07-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], TeamGenerationResponseDto.prototype, "generatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether all teams have the same number of members',
        example: true,
    }),
    __metadata("design:type", Boolean)
], TeamGenerationResponseDto.prototype, "isEvenDistribution", void 0);
class CsvUploadResponseDto {
}
exports.CsvUploadResponseDto = CsvUploadResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of unique names extracted from the CSV file',
        example: ['Alice', 'Bob', 'Charlie'],
    }),
    __metadata("design:type", Array)
], CsvUploadResponseDto.prototype, "names", void 0);
//# sourceMappingURL=team-response.dto.js.map
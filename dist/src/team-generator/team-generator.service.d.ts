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
export declare class TeamGeneratorService {
    generateTeams(generateTeamsDto: GenerateTeamsDto): TeamGenerationResult;
    private calculateFlexibleGroupSizes;
    private shuffleArray;
}

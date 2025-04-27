export declare class TeamMemberResponseDto {
    name: string;
}
export declare class TeamResponseDto {
    name: string;
    members: TeamMemberResponseDto[];
    size: number;
}
export declare class TeamGenerationResponseDto {
    teams: TeamResponseDto[];
    totalParticipants: number;
    totalTeams: number;
    generatedAt: Date;
    isEvenDistribution: boolean;
}
export declare class CsvUploadResponseDto {
    names: string[];
}

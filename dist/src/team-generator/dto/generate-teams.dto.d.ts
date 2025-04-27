export declare class GroupNameDto {
    groupId: number;
    name: string;
}
export declare class GroupSizeDto {
    groupId: number;
    size: number;
}
export declare class GenerateTeamsDto {
    numberOfGroups: number;
    names: string[];
    groupNames?: GroupNameDto[];
    customGroupSizes?: GroupSizeDto[];
}

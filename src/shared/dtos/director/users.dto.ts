export type DirectorOperationalRole = "TEACHER" | "PEDAGOGIA" | "PSICOLOGIA";

export type DirectorUserListItemDto = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    mustChangePassword: boolean;
    role: DirectorOperationalRole;
    createdAt: string;
};

export type DirectorUserDetailDto = DirectorUserListItemDto;

export type TeacherCandidateForTutorAssignmentDto = {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    isActive: boolean;
};
import type { SuperManagedRole } from "@/shared/schemas/super/admin-user.schema";


export type SuperUserListItemDto = {
    id: number;
    email: string;
    fullName: string;
    role: SuperManagedRole;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
};

export type SuperUsersListResponseDto = {
    items: SuperUserListItemDto[];
};

export type SuperUserDetailDto = {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: SuperManagedRole;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
    updatedAt: string;
};

export type SuperUserDetailResponseDto = {
    item: SuperUserDetailDto;
};
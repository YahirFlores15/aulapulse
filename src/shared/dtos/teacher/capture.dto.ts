import type { AttendanceRecordDto, AttendanceTodayResponseDto, } from "@/shared/dtos/teacher/attendance.dto";
import type { IncidentListItemDto, IncidentStatusDto, } from "@/shared/dtos/incidents/incidents.dto";


export type { AttendanceRecordDto };

export type AttendanceListResponseDto = AttendanceTodayResponseDto;

export type IncidentDto = {
    id: number;
    studentId: number;
    typeCode: string;
    typeName: string;
    createdByUserId: number;
    createdAt: string;
    note: string;
    status: IncidentStatusDto;
    closedAt: string | null;
    closedByUserId: number | null;
    updatedAt: string | null;
};

export type IncidentsListResponseDto = {
    courseId: number;
    records: IncidentDto[];
};

export function mapIncidentListItemToTeacherIncidentDto(
    item: IncidentListItemDto,
): IncidentDto {
    return {
        id: item.id,
        studentId: item.studentId,
        typeCode: item.typeCode,
        typeName: item.typeName,
        createdByUserId: item.createdByUserId,
        createdAt: item.createdAt,
        note: item.note,
        status: item.status,
        closedAt: item.closedAt,
        closedByUserId: item.closedByUserId,
        updatedAt: item.updatedAt,
    };
}
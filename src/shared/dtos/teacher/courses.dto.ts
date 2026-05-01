import type { TrafficLight } from "@/shared/enums/traffic-light";


export type TeacherCourseListItemDto = {
    id: number;
    cycleId: number;
    cycleCode: string;
    cycleName: string;
    groupId: number;
    groupCode: string;
    groupName: string;
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    teacherUserId: number;
};

export type TeacherCourseStudentDto = {
    studentId: number;
    controlNumber: string;
    firstName: string;
    lastName: string;
    secondLastName: string | null;
    fullName: string;
    riskStatus: TrafficLight | null;
    isIncomplete: boolean;
};

export type TeacherCourseStudentsResponseDto = {
    course: TeacherCourseListItemDto;
    students: TeacherCourseStudentDto[];
};
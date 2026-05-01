import type { StudentTrafficLightCauseDto } from "@/shared/dtos/risk/student-traffic-light.dto";
import type { TrafficLight } from "@/shared/enums/traffic-light";


export type TutorGroupDto = {
    id: number;
    cycleId: number;
    cycleCode: string;
    cycleName: string;
    code: string;
    name: string;
    tutorUserId: number;
    tutorName: string;
};

export type TutorStudentRiskSubjectDto = {
    courseId: number | null;
    subjectId: number | null;
    subjectCode: string;
    subjectName: string;
    teacherUserId: number | null;
    teacherName: string | null;
    riskStatus: TrafficLight | null;
    isIncomplete: boolean;
};

export type TutorStudentRiskSummaryDto = {
    studentId: number;
    controlNumber: string;
    fullName: string;
    groupId: number;
    groupCode: string;
    cycleId: number;
    trafficLight: TrafficLight | null;
    trafficLightCauses: StudentTrafficLightCauseDto[];
    trafficLightCalculatedAt: string | null;
    subjects: TutorStudentRiskSubjectDto[];
};

export type TutorGroupStudentsResponseDto = {
    group: TutorGroupDto;
    students: TutorStudentRiskSummaryDto[];
};
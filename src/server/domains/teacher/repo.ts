import { execute, query, queryOne, transaction } from "@/server/db/queries";


export type TeacherCourseRow = {
    id: number;
    cycle_id: number;
    cycle_code: string;
    cycle_name: string;
    group_id: number;
    group_code: string;
    group_name: string;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    teacher_user_id: number;
};

export type TeacherCourseStudentRow = {
    student_id: number;
    control_number: string;
    first_name: string;
    last_name: string;
    second_last_name: string | null;
};

export type AttendanceRow = {
    id: number;
    course_id: number;
    student_id: number;
    date: string;
    status: string;
    created_at: string;
    updated_at: string;
};

export type CourseAttendanceNonApplicableDayRow = {
    id: number;
    course_id: number;
    date: string;
    reason: string | null;
    created_by_user_id: number;
    created_at: string;
    updated_at: string;
};

export type CourseGradeUnitRow = {
    id: number;
    course_id: number;
    name: string;
    sort_order: number;
    weight_percentage: number;
    created_at: string;
    updated_at: string;
};

export type CourseGradeEntryRow = {
    id: number;
    course_id: number;
    student_id: number;
    grade_unit_id: number;
    score: number;
    created_at: string;
    updated_at: string;
};

export function listTeacherCourses(teacherUserId: number): TeacherCourseRow[] {
    return query<TeacherCourseRow>(
        `
      SELECT
        c.id,
        c.cycle_id,
        cy.code AS cycle_code,
        cy.name AS cycle_name,
        c.group_id,
        g.code AS group_code,
        g.name AS group_name,
        c.subject_id,
        s.code AS subject_code,
        s.name AS subject_name,
        c.teacher_user_id
      FROM courses c
      INNER JOIN cycles cy ON cy.id = c.cycle_id
      INNER JOIN groups g ON g.id = c.group_id
      INNER JOIN subjects s ON s.id = c.subject_id
      WHERE c.teacher_user_id = ?
      ORDER BY cy.name ASC, g.name ASC, s.name ASC
    `,
        [teacherUserId],
    );
}

export function getTeacherCourseById(courseId: number): TeacherCourseRow | null {
    return (
        queryOne<TeacherCourseRow>(
            `
        SELECT
          c.id,
          c.cycle_id,
          cy.code AS cycle_code,
          cy.name AS cycle_name,
          c.group_id,
          g.code AS group_code,
          g.name AS group_name,
          c.subject_id,
          s.code AS subject_code,
          s.name AS subject_name,
          c.teacher_user_id
        FROM courses c
        INNER JOIN cycles cy ON cy.id = c.cycle_id
        INNER JOIN groups g ON g.id = c.group_id
        INNER JOIN subjects s ON s.id = c.subject_id
        WHERE c.id = ?
        LIMIT 1
      `,
            [courseId],
        ) ?? null
    );
}

export function listCourseStudents(courseId: number): TeacherCourseStudentRow[] {
    return query<TeacherCourseStudentRow>(
        `
      SELECT
        st.id AS student_id,
        st.control_number,
        st.first_name,
        st.last_name,
        st.second_last_name
      FROM courses c
      INNER JOIN group_students gs
        ON gs.group_id = c.group_id
       AND gs.cycle_id = c.cycle_id
      INNER JOIN students st
        ON st.id = gs.student_id
      WHERE c.id = ?
      ORDER BY st.last_name ASC, st.second_last_name ASC, st.first_name ASC
    `,
        [courseId],
    );
}

export function courseHasStudent(courseId: number, studentId: number): boolean {
    const row = queryOne<{ found: number }>(
        `
      SELECT 1 AS found
      FROM courses c
      INNER JOIN group_students gs
        ON gs.group_id = c.group_id
       AND gs.cycle_id = c.cycle_id
      WHERE c.id = ?
        AND gs.student_id = ?
      LIMIT 1
    `,
        [courseId, studentId],
    );

    return Boolean(row);
}

export function listAttendanceByCourseAndDate(
    courseId: number,
    date: string,
): AttendanceRow[] {
    return query<AttendanceRow>(
        `
      SELECT
        id,
        course_id,
        student_id,
        date,
        status,
        created_at,
        updated_at
      FROM attendance_records
      WHERE course_id = ?
        AND date = ?
      ORDER BY student_id ASC
    `,
        [courseId, date],
    );
}

export function listAttendanceByCourseAndDateRange(
    courseId: number,
    startDate: string,
    endDate: string,
): AttendanceRow[] {
    return query<AttendanceRow>(
        `
      SELECT
        id,
        course_id,
        student_id,
        date,
        status,
        created_at,
        updated_at
      FROM attendance_records
      WHERE course_id = ?
        AND date >= ?
        AND date <= ?
      ORDER BY date ASC, student_id ASC
    `,
        [courseId, startDate, endDate],
    );
}

export function getAttendanceRecord(
    courseId: number,
    studentId: number,
    date: string,
): AttendanceRow | null {
    return (
        queryOne<AttendanceRow>(
            `
        SELECT
          id,
          course_id,
          student_id,
          date,
          status,
          created_at,
          updated_at
        FROM attendance_records
        WHERE course_id = ?
          AND student_id = ?
          AND date = ?
        LIMIT 1
      `,
            [courseId, studentId, date],
        ) ?? null
    );
}

export function insertAttendanceRecord(input: {
    courseId: number;
    studentId: number;
    date: string;
    status: string;
}): void {
    execute(
        `
      INSERT INTO attendance_records (
        course_id,
        student_id,
        date,
        status,
        updated_at
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
        [input.courseId, input.studentId, input.date, input.status],
    );
}

export function updateAttendanceRecord(input: {
    courseId: number;
    studentId: number;
    date: string;
    status: string;
}): void {
    execute(
        `
      UPDATE attendance_records
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE course_id = ?
        AND student_id = ?
        AND date = ?
    `,
        [input.status, input.courseId, input.studentId, input.date],
    );
}

export function deleteAttendanceByCourseAndDate(
    courseId: number,
    date: string,
): void {
    execute(
        `
      DELETE FROM attendance_records
      WHERE course_id = ?
        AND date = ?
    `,
        [courseId, date],
    );
}

export function upsertAttendanceBatch(
    courseId: number,
    date: string,
    records: Array<{ studentId: number; status: string }>,
): void {
    transaction(() => {
        for (const record of records) {
            const existing = getAttendanceRecord(courseId, record.studentId, date);

            if (existing) {
                updateAttendanceRecord({
                    courseId,
                    studentId: record.studentId,
                    date,
                    status: record.status,
                });
                continue;
            }

            insertAttendanceRecord({
                courseId,
                studentId: record.studentId,
                date,
                status: record.status,
            });
        }
    });
}

export function getCourseAttendanceNonApplicableDay(
    courseId: number,
    date: string,
): CourseAttendanceNonApplicableDayRow | null {
    return (
        queryOne<CourseAttendanceNonApplicableDayRow>(
            `
      SELECT
        id,
        course_id,
        date,
        reason,
        created_by_user_id,
        created_at,
        updated_at
      FROM course_attendance_non_applicable_days
      WHERE course_id = ?
        AND date = ?
      LIMIT 1
    `,
            [courseId, date],
        ) ?? null
    );
}

export function markCourseAttendanceNonApplicableDay(input: {
    courseId: number;
    date: string;
    reason: string | null;
    createdByUserId: number;
}): void {
    transaction(() => {
        deleteAttendanceByCourseAndDate(input.courseId, input.date);

        execute(
            `
        INSERT INTO course_attendance_non_applicable_days (
          course_id,
          date,
          reason,
          created_by_user_id,
          updated_at
        )
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(course_id, date) DO UPDATE SET
          reason = excluded.reason,
          created_by_user_id = excluded.created_by_user_id,
          updated_at = CURRENT_TIMESTAMP
      `,
            [input.courseId, input.date, input.reason, input.createdByUserId],
        );
    });
}

export function deleteCourseAttendanceNonApplicableDay(
    courseId: number,
    date: string,
): void {
    execute(
        `
      DELETE FROM course_attendance_non_applicable_days
      WHERE course_id = ?
        AND date = ?
    `,
        [courseId, date],
    );
}

export function listCourseGradeUnits(courseId: number): CourseGradeUnitRow[] {
    return query<CourseGradeUnitRow>(
        `
      SELECT
        id,
        course_id,
        name,
        sort_order,
        weight_percentage,
        created_at,
        updated_at
      FROM course_grade_units
      WHERE course_id = ?
      ORDER BY sort_order ASC, id ASC
    `,
        [courseId],
    );
}

export function getCourseGradeUnitById(unitId: number): CourseGradeUnitRow | null {
    return (
        queryOne<CourseGradeUnitRow>(
            `
        SELECT
          id,
          course_id,
          name,
          sort_order,
          weight_percentage,
          created_at,
          updated_at
        FROM course_grade_units
        WHERE id = ?
        LIMIT 1
      `,
            [unitId],
        ) ?? null
    );
}

export function replaceCourseGradeUnits(
    courseId: number,
    units: Array<{
        name: string;
        sortOrder: number;
        weightPercentage: number;
    }>,
): void {
    transaction(() => {
        execute(`DELETE FROM course_grade_entries WHERE course_id = ?`, [courseId]);
        execute(`DELETE FROM course_grade_units WHERE course_id = ?`, [courseId]);

        for (const unit of units) {
            execute(
                `
          INSERT INTO course_grade_units (
            course_id,
            name,
            sort_order,
            weight_percentage,
            updated_at
          )
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
                [courseId, unit.name, unit.sortOrder, unit.weightPercentage],
            );
        }
    });
}

export function listCourseGradeEntries(courseId: number): CourseGradeEntryRow[] {
    return query<CourseGradeEntryRow>(
        `
      SELECT
        id,
        course_id,
        student_id,
        grade_unit_id,
        score,
        created_at,
        updated_at
      FROM course_grade_entries
      WHERE course_id = ?
      ORDER BY student_id ASC, grade_unit_id ASC
    `,
        [courseId],
    );
}

export function getCourseGradeEntryByUnitAndStudent(
    unitId: number,
    studentId: number,
): CourseGradeEntryRow | null {
    return (
        queryOne<CourseGradeEntryRow>(
            `
        SELECT
          id,
          course_id,
          student_id,
          grade_unit_id,
          score,
          created_at,
          updated_at
        FROM course_grade_entries
        WHERE grade_unit_id = ?
          AND student_id = ?
        LIMIT 1
      `,
            [unitId, studentId],
        ) ?? null
    );
}

export function insertCourseGradeEntry(input: {
    courseId: number;
    studentId: number;
    gradeUnitId: number;
    score: number;
}): void {
    execute(
        `
      INSERT INTO course_grade_entries (
        course_id,
        student_id,
        grade_unit_id,
        score,
        updated_at
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
        [input.courseId, input.studentId, input.gradeUnitId, input.score],
    );
}

export function updateCourseGradeEntry(input: {
    unitId: number;
    studentId: number;
    score: number;
}): void {
    execute(
        `
      UPDATE course_grade_entries
      SET score = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE grade_unit_id = ?
        AND student_id = ?
    `,
        [input.score, input.unitId, input.studentId],
    );
}

export function upsertCourseGradeEntries(
    courseId: number,
    unitId: number,
    records: Array<{ studentId: number; score: number }>,
): void {
    transaction(() => {
        for (const record of records) {
            const existing = getCourseGradeEntryByUnitAndStudent(
                unitId,
                record.studentId,
            );

            if (existing) {
                updateCourseGradeEntry({
                    unitId,
                    studentId: record.studentId,
                    score: record.score,
                });
                continue;
            }

            insertCourseGradeEntry({
                courseId,
                studentId: record.studentId,
                gradeUnitId: unitId,
                score: record.score,
            });
        }
    });
}
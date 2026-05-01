import { parseStudentImportSheetRows } from "@/server/domains/director/student-import-parser";
import { importStudentsInputSchema } from "@/shared/schemas/director/student-import.schema";
import { directorService } from "@/server/domains/director/service";
import { requireRole } from "@/server/auth/guards";
import { ROLE } from "@/shared/enums/roles";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { handleDirectorError } from "../../_utils";


export const runtime = "nodejs";

export async function POST(request: Request) {
    const auth = await requireRole(ROLE.DIRECTOR);
    if (!auth.ok) return auth.response;

    try {
        const formData = await request.formData();
        const groupId = formData.get("groupId");
        const file = formData.get("file");

        if (typeof groupId !== "string" || groupId.trim() === "") {
            return NextResponse.json(
                { error: "El grupo es obligatorio." },
                { status: 400 },
            );
        }

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "Debes seleccionar un archivo Excel." },
                { status: 400 },
            );
        }

        const normalizedFileName = file.name.toLowerCase();

        if (!normalizedFileName.endsWith(".xlsx") && !normalizedFileName.endsWith(".xls")) {
            return NextResponse.json(
                { error: "El archivo debe ser .xlsx o .xls." },
                { status: 400 },
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
            return NextResponse.json(
                { error: "El archivo no contiene hojas para importar." },
                { status: 400 },
            );
        }

        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
            return NextResponse.json(
                { error: "No se pudo leer la primera hoja del archivo." },
                { status: 400 },
            );
        }

        const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
            header: 1,
            defval: "",
            raw: false,
        });

        const parsedSheet = parseStudentImportSheetRows(sheetRows);

        if (parsedSheet.errors.length > 0) {
            return NextResponse.json(
                {
                    error: "El archivo no tiene los encabezados requeridos.",
                    data: {
                        groupId: Number(groupId),
                        groupCode: "",
                        groupName: "",
                        cycleId: 0,
                        totalRows: 0,
                        createdStudents: 0,
                        assignedStudents: 0,
                        duplicateStudents: 0,
                        failedRows: parsedSheet.errors.length,
                        importedStudents: [],
                        duplicates: [],
                        errors: parsedSheet.errors,
                    },
                },
                { status: 400 },
            );
        }

        const parsed = importStudentsInputSchema.parse({
            groupId,
            rows: parsedSheet.rows,
        });

        const result = await directorService.importStudents(parsed);

        return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
        return handleDirectorError(error);
    }
}
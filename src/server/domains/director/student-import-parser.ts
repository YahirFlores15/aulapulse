export type ParsedStudentImportRow = {
    rowNumber: number;
    controlNumber: string;
    firstName: string;
    lastName: string;
    secondLastName: string;
    email: string;
    phone: string;
};

export type StudentImportParseError = {
    rowNumber: number;
    field: "header" | "row";
    message: string;
};

type CanonicalHeader =
    | "controlNumber"
    | "firstName"
    | "lastName"
    | "secondLastName"
    | "email"
    | "phone";

type HeaderMap = Partial<Record<CanonicalHeader, number>>;

const requiredHeaders: CanonicalHeader[] = [
    "controlNumber",
    "firstName",
    "lastName",
];

const headerAliases: Record<CanonicalHeader, string[]> = {
    controlNumber: [
        "controlnumber",
        "control_number",
        "numero_control",
        "número_control",
        "numerocontrol",
        "númerocontrol",
        "numero de control",
        "número de control",
        "matricula",
        "matrícula",
        "control",
    ],
    firstName: [
        "firstname",
        "first_name",
        "nombre",
        "nombres",
    ],
    lastName: [
        "lastname",
        "last_name",
        "apellido_paterno",
        "apellidopaterno",
        "apellido paterno",
        "primer_apellido",
        "primerapellido",
        "primer apellido",
    ],
    secondLastName: [
        "secondlastname",
        "second_last_name",
        "apellido_materno",
        "apellidomaterno",
        "apellido materno",
        "segundo_apellido",
        "segundoapellido",
        "segundo apellido",
    ],
    email: [
        "email",
        "correo",
        "correo_electronico",
        "correo electrónico",
        "correoelectronico",
        "correoelectrónico",
    ],
    phone: [
        "phone",
        "telefono",
        "teléfono",
        "celular",
        "numero_telefono",
        "número_telefono",
        "numero telefono",
        "número telefono",
        "numero de telefono",
        "número de teléfono",
    ],
};

function removeAccents(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeHeader(value: unknown) {
    return removeAccents(String(value ?? ""))
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[-.]/g, "_");
}

function normalizeCellValue(value: unknown) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}

function isEmptyRow(row: unknown[]) {
    return row.every((cell) => normalizeCellValue(cell) === "");
}

function resolveCanonicalHeader(rawHeader: unknown): CanonicalHeader | null {
    const normalizedHeader = normalizeHeader(rawHeader);

    for (const [canonicalHeader, aliases] of Object.entries(headerAliases)) {
        const normalizedAliases = aliases.map(normalizeHeader);

        if (normalizedAliases.includes(normalizedHeader)) {
            return canonicalHeader as CanonicalHeader;
        }
    }

    return null;
}

function buildHeaderMap(headerRow: unknown[]) {
    const headerMap: HeaderMap = {};

    headerRow.forEach((header, index) => {
        const canonicalHeader = resolveCanonicalHeader(header);

        if (!canonicalHeader) {
            return;
        }

        if (headerMap[canonicalHeader] === undefined) {
            headerMap[canonicalHeader] = index;
        }
    });

    return headerMap;
}

function getRequiredHeaderErrors(headerMap: HeaderMap): StudentImportParseError[] {
    const missingHeaders = requiredHeaders.filter(
        (header) => headerMap[header] === undefined,
    );

    if (missingHeaders.length === 0) {
        return [];
    }

    const labels: Record<CanonicalHeader, string> = {
        controlNumber: "controlNumber / matrícula / número de control",
        firstName: "firstName / nombre",
        lastName: "lastName / apellido paterno",
        secondLastName: "secondLastName / apellido materno",
        email: "email / correo",
        phone: "phone / teléfono",
    };

    return missingHeaders.map((header) => ({
        rowNumber: 1,
        field: "header",
        message: `Falta la columna requerida: ${labels[header]}.`,
    }));
}

function getValue(row: unknown[], headerMap: HeaderMap, header: CanonicalHeader) {
    const index = headerMap[header];

    if (index === undefined) {
        return "";
    }

    return normalizeCellValue(row[index]);
}

export function parseStudentImportSheetRows(sheetRows: unknown[][]): {
    rows: ParsedStudentImportRow[];
    errors: StudentImportParseError[];
} {
    if (sheetRows.length === 0) {
        return {
            rows: [],
            errors: [
                {
                    rowNumber: 1,
                    field: "header",
                    message: "El archivo no contiene encabezados.",
                },
            ],
        };
    }

    const headerRowIndex = sheetRows.findIndex((row) => !isEmptyRow(row));

    if (headerRowIndex === -1) {
        return {
            rows: [],
            errors: [
                {
                    rowNumber: 1,
                    field: "header",
                    message: "El archivo está vacío.",
                },
            ],
        };
    }

    const headerRow = sheetRows[headerRowIndex];
    const headerMap = buildHeaderMap(headerRow);
    const headerErrors = getRequiredHeaderErrors(headerMap);

    if (headerErrors.length > 0) {
        return {
            rows: [],
            errors: headerErrors,
        };
    }

    const dataRows = sheetRows.slice(headerRowIndex + 1);
    const rows: ParsedStudentImportRow[] = [];

    dataRows.forEach((row, index) => {
        const rowNumber = headerRowIndex + index + 2;

        if (isEmptyRow(row)) {
            return;
        }

        rows.push({
            rowNumber,
            controlNumber: getValue(row, headerMap, "controlNumber"),
            firstName: getValue(row, headerMap, "firstName"),
            lastName: getValue(row, headerMap, "lastName"),
            secondLastName: getValue(row, headerMap, "secondLastName"),
            email: getValue(row, headerMap, "email"),
            phone: getValue(row, headerMap, "phone"),
        });
    });

    return {
        rows,
        errors: [],
    };
}
export type FieldType = "TEXT" | "NUMBER" | "FILE" | "BOOLEAN" | "DROPDOWN" | "CHECKLIST";
export type RunStatus = "PENDING" | "SUBMITTED" | "PASSED" | "FAILED";

export interface TestFieldWithOptions {
  id: string;
  testCaseId: string;
  fieldName: string;
  fieldType: FieldType;
  choices?: string[] | null; // Used for DROPDOWN types
  steps?: string[] | null;   // Used for CHECKLIST types
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestCaseWithFields {
  id: string;
  title: string;
  description: string | null;
  pdfUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryTargetGroup?: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  fields: TestFieldWithOptions[];
}

export interface TestCaseWithCounts {
  id: string;
  title: string;
  description: string | null;
  pdfUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryTargetGroup?: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  fieldsCount: number;
  runsCount: number;
}

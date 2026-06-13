import { pgEnum, pgTable, uuid, text, timestamp, jsonb, integer, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["ADMIN", "TESTER"]);
export const fieldTypeEnum = pgEnum("field_type", ["TEXT", "NUMBER", "FILE", "BOOLEAN", "DROPDOWN", "CHECKLIST"]);
export const runStatusEnum = pgEnum("run_status", ["PENDING", "SUBMITTED", "PASSED", "FAILED"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("TESTER").notNull(),
  testerGroup: text("tester_group"), // "JOBSEEKER" | "EMPLOYER" | null
  employerLocked: boolean("employer_locked").default(true).notNull(),
  resourceSelectCount: integer("resource_select_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Test Case Categories table
export const testCaseCategories = pgTable("test_case_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  order: integer("order").default(0).notNull(),
  targetGroup: text("target_group").default("JOBSEEKER").notNull(), // "JOBSEEKER" | "EMPLOYER"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Test Cases table
export const testCases = pgTable("test_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  pdfUrl: text("pdf_url"),
  categoryId: uuid("category_id").references(() => testCaseCategories.id, { onDelete: "cascade" }),
  timer: integer("timer"),
  order: integer("order").default(0).notNull(),
  createdById: uuid("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  categoryIdIdx: index("test_cases_category_id_idx").on(table.categoryId),
  createdByIdIdx: index("test_cases_created_by_id_idx").on(table.createdById),
}));

// Test Fields table
export const testFields = pgTable("test_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  testCaseId: uuid("test_case_id").notNull().references(() => testCases.id, { onDelete: "cascade" }),
  fieldName: text("field_name").notNull(),
  fieldType: fieldTypeEnum("field_type").default("TEXT").notNull(),
  choices: jsonb("choices").$type<string[]>(),
  steps: jsonb("steps").$type<string[]>(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  testCaseIdIdx: index("test_fields_test_case_id_idx").on(table.testCaseId),
}));

// Test Runs table
export const testRuns = pgTable("test_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  testCaseId: uuid("test_case_id").notNull().references(() => testCases.id, { onDelete: "cascade" }),
  testerId: uuid("tester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: runStatusEnum("status").default("PENDING").notNull(),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  testCaseIdIdx: index("test_runs_test_case_id_idx").on(table.testCaseId),
  testerIdIdx: index("test_runs_tester_id_idx").on(table.testerId),
}));

// Test Answers table
export const testAnswers = pgTable("test_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  testRunId: uuid("test_run_id").notNull().references(() => testRuns.id, { onDelete: "cascade" }),
  testFieldId: uuid("test_field_id").notNull().references(() => testFields.id, { onDelete: "cascade" }),
  value: text("value"),
  screenshotUrl: text("screenshot_url"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  testRunIdIdx: index("test_answers_test_run_id_idx").on(table.testRunId),
  testFieldIdIdx: index("test_answers_test_field_id_idx").on(table.testFieldId),
}));

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  testCases: many(testCases),
  testRuns: many(testRuns),
}));

export const testCaseCategoriesRelations = relations(testCaseCategories, ({ many }) => ({
  testCases: many(testCases),
}));

export const testCasesRelations = relations(testCases, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [testCases.createdById],
    references: [users.id],
  }),
  category: one(testCaseCategories, {
    fields: [testCases.categoryId],
    references: [testCaseCategories.id],
  }),
  testFields: many(testFields),
  testRuns: many(testRuns),
}));

export const testFieldsRelations = relations(testFields, ({ one, many }) => ({
  testCase: one(testCases, {
    fields: [testFields.testCaseId],
    references: [testCases.id],
  }),
  testAnswers: many(testAnswers),
}));

export const testRunsRelations = relations(testRuns, ({ one, many }) => ({
  testCase: one(testCases, {
    fields: [testRuns.testCaseId],
    references: [testCases.id],
  }),
  tester: one(users, {
    fields: [testRuns.testerId],
    references: [users.id],
  }),
  testAnswers: many(testAnswers),
}));

export const testAnswersRelations = relations(testAnswers, ({ one }) => ({
  testRun: one(testRuns, {
    fields: [testAnswers.testRunId],
    references: [testRuns.id],
  }),
  testField: one(testFields, {
    fields: [testAnswers.testFieldId],
    references: [testFields.id],
  }),
}));

export const helpRequests = pgTable("help_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  testerId: uuid("tester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "CHAT" | "IN_PERSON"
  status: text("status").default("PENDING").notNull(), // "PENDING" | "RESOLVED"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  testerIdIdx: index("help_requests_tester_id_idx").on(table.testerId),
}));

export const helpMessages = pgTable("help_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  helpRequestId: uuid("help_request_id").notNull().references(() => helpRequests.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  helpRequestIdIdx: index("help_messages_help_request_id_idx").on(table.helpRequestId),
  senderIdIdx: index("help_messages_sender_id_idx").on(table.senderId),
}));

export const helpRequestsRelations = relations(helpRequests, ({ one, many }) => ({
  tester: one(users, {
    fields: [helpRequests.testerId],
    references: [users.id],
  }),
  messages: many(helpMessages),
}));

export const helpMessagesRelations = relations(helpMessages, ({ one }) => ({
  helpRequest: one(helpRequests, {
    fields: [helpMessages.helpRequestId],
    references: [helpRequests.id],
  }),
  sender: one(users, {
    fields: [helpMessages.senderId],
    references: [users.id],
  }),
}));

// Mobile Uploads table for QR photo upload feature
export const mobileUploads = pgTable("mobile_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  testRunId: uuid("test_run_id").notNull(),
  testFieldId: uuid("test_field_id").notNull(),
  imageUrl: text("image_url"),
  status: text("status").default("PENDING").notNull(), // "PENDING" | "COMPLETED"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  testRunIdIdx: index("mobile_uploads_test_run_id_idx").on(table.testRunId),
  testFieldIdIdx: index("mobile_uploads_test_field_id_idx").on(table.testFieldId),
}));

// UAT Resource Sets table
export const uatResourceSets = pgTable("uat_resource_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  photoUrl: text("photo_url").notNull(),
  resumeUrl: text("resume_url").notNull(),
  icUrl: text("ic_url").notNull(),
  testerId: uuid("tester_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  testerIdIdx: index("uat_resource_sets_tester_id_idx").on(table.testerId),
}));

export const uatResourceSetsRelations = relations(uatResourceSets, ({ one }) => ({
  tester: one(users, {
    fields: [uatResourceSets.testerId],
    references: [users.id],
  }),
}));



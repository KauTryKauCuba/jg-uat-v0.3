import { pgEnum, pgTable, uuid, text, timestamp, jsonb, integer, boolean, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["ADMIN", "TESTER"]);
export const fieldTypeEnum = pgEnum("field_type", ["TEXT", "NUMBER", "FILE", "BOOLEAN", "DROPDOWN", "CHECKLIST"]);
export const runStatusEnum = pgEnum("run_status", ["PENDING", "SUBMITTED", "PASSED", "FAILED"]);

// Organisations table
export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
  organisationId: uuid("organisation_id").references(() => organisations.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Test Case Categories table
export const testCaseCategories = pgTable("test_case_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(0).notNull(),
  targetGroup: text("target_group").default("JOBSEEKER_WEB").notNull(), // "JOBSEEKER_WEB" | "EMPLOYER"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique("test_case_categories_name_target_group_unique").on(t.name, t.targetGroup)
]);

// Test Cases table
export const testCases = pgTable("test_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  pdfUrl: text("pdf_url"),
  categoryId: uuid("category_id").references(() => testCaseCategories.id, { onDelete: "cascade" }),
  timer: integer("timer"),
  order: integer("order").default(0).notNull(),
  hidden: boolean("hidden").default(false).notNull(),
  createdById: uuid("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
});

// Test Runs table
export const testRuns = pgTable("test_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  testCaseId: uuid("test_case_id").notNull().references(() => testCases.id, { onDelete: "cascade" }),
  testerId: uuid("tester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: runStatusEnum("status").default("PENDING").notNull(),
  submittedAt: timestamp("submitted_at"),
  elapsedSeconds: integer("elapsed_seconds").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
});

// Relations definitions
export const usersRelations = relations(users, ({ one, many }) => ({
  testCases: many(testCases),
  testRuns: many(testRuns),
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id],
  }),
  feedback: one(testerFeedbacks),
}));

export const organisationsRelations = relations(organisations, ({ many }) => ({
  users: many(users),
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
});

export const helpMessages = pgTable("help_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  helpRequestId: uuid("help_request_id").notNull().references(() => helpRequests.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
});

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
});

export const uatResourceSetsRelations = relations(uatResourceSets, ({ one }) => ({
  tester: one(users, {
    fields: [uatResourceSets.testerId],
    references: [users.id],
  }),
}));

export const uatBriefingDeck = pgTable("uat_briefing_deck", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  fileName: text("file_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const uatTargetGroups = pgTable("uat_target_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  order: integer("order").default(0).notNull(),
  locked: boolean("locked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const testRunAuditLogs = pgTable("test_run_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  testRunId: uuid("test_run_id").notNull().references(() => testRuns.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // "SUBMIT" | "REOPEN"
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testRunAuditLogsRelations = relations(testRunAuditLogs, ({ one }) => ({
  testRun: one(testRuns, {
    fields: [testRunAuditLogs.testRunId],
    references: [testRuns.id],
  }),
  user: one(users, {
    fields: [testRunAuditLogs.userId],
    references: [users.id],
  }),
}));

export const uatEnvironment = pgTable("uat_environment", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const testerFeedbacks = pgTable("tester_feedbacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  testerId: uuid("tester_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  ratingOverall: integer("rating_overall").notNull(),
  ratingEaseOfUse: integer("rating_ease_of_use").notNull(),
  ratingInstructions: integer("rating_instructions").notNull(),
  ratingResultForm: integer("rating_result_form").notNull(),
  impressiveAspects: text("impressive_aspects"),
  improvementAreas: text("improvement_areas"),
  otherFeedback: text("other_feedback"),
  uatSessionStart: text("uat_session_start"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const testerFeedbacksRelations = relations(testerFeedbacks, ({ one }) => ({
  tester: one(users, {
    fields: [testerFeedbacks.testerId],
    references: [users.id],
  }),
}));

export const feedbackAuditLogs = pgTable("feedback_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedbackId: uuid("feedback_id").notNull().references(() => testerFeedbacks.id, { onDelete: "cascade" }),
  testerId: uuid("tester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  previousData: jsonb("previous_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedbackAuditLogsRelations = relations(feedbackAuditLogs, ({ one }) => ({
  feedback: one(testerFeedbacks, {
    fields: [feedbackAuditLogs.feedbackId],
    references: [testerFeedbacks.id],
  }),
  tester: one(users, {
    fields: [feedbackAuditLogs.testerId],
    references: [users.id],
  }),
}));

export const testerSignOffs = pgTable("tester_sign_offs", {
  id: uuid("id").primaryKey().defaultRandom(),
  testerId: uuid("tester_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  designation: text("designation").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const testerSignOffsRelations = relations(testerSignOffs, ({ one }) => ({
  tester: one(users, {
    fields: [testerSignOffs.testerId],
    references: [users.id],
  }),
}));

export const signOffAuditLogs = pgTable("sign_off_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  signOffId: uuid("sign_off_id").notNull().references(() => testerSignOffs.id, { onDelete: "cascade" }),
  testerId: uuid("tester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  previousData: jsonb("previous_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const signOffAuditLogsRelations = relations(signOffAuditLogs, ({ one }) => ({
  signOff: one(testerSignOffs, {
    fields: [signOffAuditLogs.signOffId],
    references: [testerSignOffs.id],
  }),
  tester: one(users, {
    fields: [signOffAuditLogs.testerId],
    references: [users.id],
  }),
}));








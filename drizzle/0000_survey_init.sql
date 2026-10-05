CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."survey_kind" AS ENUM('T1', 'G1', 'G2');--> statement-breakpoint
CREATE TABLE "answer_items" (
	"submission_id" uuid NOT NULL,
	"response_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"kind" "survey_kind" NOT NULL,
	"teacher_key" text,
	"student_erp_id" text NOT NULL,
	"class_key" text NOT NULL,
	"section_key" text DEFAULT '' NOT NULL,
	"subject_key" text DEFAULT '' NOT NULL,
	"question_key" text NOT NULL,
	"area_key" text NOT NULL,
	"option_key" text,
	"mark" numeric(3, 1),
	"is_na" boolean DEFAULT false NOT NULL,
	CONSTRAINT "answer_items_response_id_question_key_subject_key_pk" PRIMARY KEY("response_id","question_key","subject_key")
);
--> statement-breakpoint
CREATE TABLE "import_runs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"status" text NOT NULL,
	"summary" jsonb NOT NULL,
	"problems" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"kind" "survey_kind" NOT NULL,
	"teacher_key" text,
	"subject_key" text DEFAULT '' NOT NULL,
	"student_erp_id" text NOT NULL,
	"student_name" text NOT NULL,
	"class_key" text NOT NULL,
	"section_key" text DEFAULT '' NOT NULL,
	"roll" integer,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"note" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"erp_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"class_key" text NOT NULL,
	"section_key" text DEFAULT '' NOT NULL,
	"roll" integer,
	"father_name" text,
	"father_mobile" text,
	"mother_mobile" text,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"kind" "survey_kind" NOT NULL,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"superseded_by" uuid,
	"duplicate_flag" boolean DEFAULT false NOT NULL,
	"receipt_token" text,
	"submitter_name" text,
	"submitter_relation" text,
	"submitter_mobile" text,
	"verified" boolean,
	"teacher_key" text,
	"teacher_name" text,
	"class_key" text NOT NULL,
	"section_key" text DEFAULT '' NOT NULL,
	"subject_key" text DEFAULT '' NOT NULL,
	"subject_name" text,
	"comment" text,
	"client_ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"mirrored_at" timestamp with time zone,
	CONSTRAINT "submissions_receipt_token_unique" UNIQUE("receipt_token")
);
--> statement-breakpoint
CREATE TABLE "survey_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sanity_round_id" text NOT NULL,
	"kind" "survey_kind" NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"link_key" text NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "survey_rounds_sanity_round_id_unique" UNIQUE("sanity_round_id"),
	CONSTRAINT "survey_rounds_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "answer_items" ADD CONSTRAINT "answer_items_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_items" ADD CONSTRAINT "answer_items_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_items" ADD CONSTRAINT "answer_items_round_id_survey_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."survey_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_round_id_survey_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."survey_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_student_erp_id_students_erp_id_fk" FOREIGN KEY ("student_erp_id") REFERENCES "public"."students"("erp_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_round_id_survey_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."survey_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_superseded_by_submissions_id_fk" FOREIGN KEY ("superseded_by") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answer_items_round_idx" ON "answer_items" USING btree ("round_id","kind","class_key");--> statement-breakpoint
CREATE INDEX "answer_items_student_idx" ON "answer_items" USING btree ("student_erp_id","round_id");--> statement-breakpoint
CREATE INDEX "answer_items_teacher_idx" ON "answer_items" USING btree ("round_id","teacher_key");--> statement-breakpoint
CREATE UNIQUE INDEX "responses_submission_student_uq" ON "responses" USING btree ("submission_id","student_erp_id");--> statement-breakpoint
CREATE UNIQUE INDEX "responses_guardian_current_uq" ON "responses" USING btree ("round_id","student_erp_id") WHERE "responses"."is_current" AND "responses"."kind" <> 'T1';--> statement-breakpoint
CREATE UNIQUE INDEX "responses_t1_current_uq" ON "responses" USING btree ("round_id","teacher_key","subject_key","student_erp_id") WHERE "responses"."is_current" AND "responses"."kind" = 'T1';--> statement-breakpoint
CREATE INDEX "responses_student_idx" ON "responses" USING btree ("student_erp_id");--> statement-breakpoint
CREATE INDEX "students_class_idx" ON "students" USING btree ("class_key","section_key");--> statement-breakpoint
CREATE INDEX "students_father_mobile_idx" ON "students" USING btree ("father_mobile");--> statement-breakpoint
CREATE INDEX "students_mother_mobile_idx" ON "students" USING btree ("mother_mobile");--> statement-breakpoint
CREATE INDEX "submissions_round_idx" ON "submissions" USING btree ("round_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_t1_draft_uq" ON "submissions" USING btree ("round_id","teacher_key","class_key","section_key","subject_key") WHERE "submissions"."kind" = 'T1' AND "submissions"."status" = 'draft';--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_t1_current_uq" ON "submissions" USING btree ("round_id","teacher_key","class_key","section_key","subject_key") WHERE "submissions"."kind" = 'T1' AND "submissions"."status" = 'submitted' AND "submissions"."superseded_by" IS NULL;--> statement-breakpoint
CREATE INDEX "submissions_unmirrored_idx" ON "submissions" USING btree ("submitted_at") WHERE "submissions"."status" = 'submitted' AND "submissions"."mirrored_at" IS NULL;
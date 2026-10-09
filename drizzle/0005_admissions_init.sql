CREATE TYPE "public"."application_status" AS ENUM('draft', 'unpaid', 'paid', 'interview', 'evaluated', 'admitted', 'waitlisted', 'not_selected', 'sent_to_erp');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('initiated', 'valid', 'failed', 'cancelled', 'held');--> statement-breakpoint
CREATE TABLE "admission_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session" text NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_cycles_session_unique" UNIQUE("session")
);
--> statement-breakpoint
CREATE TABLE "admission_snapshots" (
	"cycle_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"source_rev" text,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_snapshots_cycle_id_version_pk" PRIMARY KEY("cycle_id","version")
);
--> statement-breakpoint
CREATE TABLE "application_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"application_id" uuid,
	"label" text NOT NULL,
	"kind" text NOT NULL,
	"actor" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_serials" (
	"cycle_id" uuid NOT NULL,
	"class_code" text NOT NULL,
	"last_serial" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "application_serials_cycle_id_class_code_pk" PRIMARY KEY("cycle_id","class_code")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"snapshot_version" integer NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"locale" text DEFAULT 'bengali' NOT NULL,
	"resume_token_hash" text NOT NULL,
	"primary_mobile" text NOT NULL,
	"email" text NOT NULL,
	"student_name_bn" text,
	"student_name_en" text,
	"date_of_birth" text,
	"class_value" text,
	"father_name" text,
	"mother_name" text,
	"secondary_mobile" text,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attribution" jsonb,
	"public_ref" text,
	"class_code" text,
	"serial" integer,
	"declared_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"attended_at" timestamp with time zone,
	"eval_fee_received_at" timestamp with time zone,
	"pdf_key" text,
	"confirmation_email_at" timestamp with time zone,
	"resume_email_at" timestamp with time zone,
	"mirrored_at" timestamp with time zone,
	"mirror_claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_resume_token_hash_unique" UNIQUE("resume_token_hash"),
	CONSTRAINT "applications_paid_has_ref_chk" CHECK ("applications"."status" IN ('draft', 'unpaid') OR "applications"."public_ref" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"tran_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"status" "payment_status" DEFAULT 'initiated' NOT NULL,
	"session_key" text,
	"val_id" text,
	"bank_tran_id" text,
	"card_type" text,
	"risk_level" text,
	"gateway_response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "payments_tran_id_unique" UNIQUE("tran_id")
);
--> statement-breakpoint
ALTER TABLE "admission_snapshots" ADD CONSTRAINT "admission_snapshots_cycle_id_admission_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."admission_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_serials" ADD CONSTRAINT "application_serials_cycle_id_admission_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."admission_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_cycle_id_admission_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."admission_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admission_snapshots_rev_uq" ON "admission_snapshots" USING btree ("cycle_id","source_rev");--> statement-breakpoint
CREATE INDEX "application_events_app_idx" ON "application_events" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_ref_uq" ON "applications" USING btree ("cycle_id","public_ref");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("cycle_id","status");--> statement-breakpoint
CREATE INDEX "applications_mobile_idx" ON "applications" USING btree ("primary_mobile");--> statement-breakpoint
CREATE INDEX "applications_dob_idx" ON "applications" USING btree ("date_of_birth");--> statement-breakpoint
CREATE INDEX "applications_mirror_idx" ON "applications" USING btree ("paid_at") WHERE "applications"."paid_at" IS NOT NULL AND "applications"."mirrored_at" IS NULL;--> statement-breakpoint
CREATE INDEX "payments_application_idx" ON "payments" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "payments_pending_idx" ON "payments" USING btree ("created_at") WHERE "payments"."status" = 'initiated';
CREATE TYPE "public"."routine_gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."routine_gender_rule" AS ENUM('any', 'male', 'female');--> statement-breakpoint
CREATE TYPE "public"."routine_group_kind" AS ENUM('section', 'level');--> statement-breakpoint
CREATE TYPE "public"."routine_role" AS ENUM('main', 'ta');--> statement-breakpoint
CREATE TYPE "public"."routine_slot_kind" AS ENUM('group', 'teacher', 'room');--> statement-breakpoint
CREATE TYPE "public"."routine_status" AS ENUM('draft', 'active');--> statement-breakpoint
CREATE TABLE "routine_absences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"teacher_id" uuid NOT NULL,
	"period_ids" uuid[],
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"days" smallint[] NOT NULL,
	"subject_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"ta_id" uuid,
	"room_id" uuid,
	"note" text DEFAULT '' NOT NULL,
	CONSTRAINT "routine_assignments_days_ck" CHECK (cardinality("routine_assignments"."days") > 0 AND "routine_assignments"."days" <@ ARRAY[0,1,2,3,4,5]::smallint[]),
	CONSTRAINT "routine_assignments_ta_ck" CHECK ("routine_assignments"."ta_id" IS NULL OR "routine_assignments"."ta_id" <> "routine_assignments"."teacher_id")
);
--> statement-breakpoint
CREATE TABLE "routine_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" "routine_group_kind" DEFAULT 'section' NOT NULL,
	"section" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"default_room_id" uuid,
	"gender_rule" "routine_gender_rule" DEFAULT 'any' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "routine_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "routine_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"starts_at" smallint NOT NULL,
	"ends_at" smallint NOT NULL,
	CONSTRAINT "routine_periods_time_ck" CHECK ("routine_periods"."ends_at" > "routine_periods"."starts_at" AND "routine_periods"."starts_at" >= 0 AND "routine_periods"."ends_at" <= 1440)
);
--> statement-breakpoint
CREATE TABLE "routine_proxies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"assignment_id" uuid,
	"role" "routine_role" DEFAULT 'main' NOT NULL,
	"period_id" uuid,
	"proxy_teacher_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"shared" boolean DEFAULT false NOT NULL,
	CONSTRAINT "routine_rooms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "routine_routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "routine_status" DEFAULT 'draft' NOT NULL,
	"copied_from_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routine_routines_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "routine_slots" (
	"routine_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"day" smallint NOT NULL,
	"kind" "routine_slot_kind" NOT NULL,
	"ref_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	CONSTRAINT "routine_slots_routine_id_period_id_day_kind_ref_id_pk" PRIMARY KEY("routine_id","period_id","day","kind","ref_id")
);
--> statement-breakpoint
CREATE TABLE "routine_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "routine_subjects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "routine_teacher_subjects" (
	"teacher_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	CONSTRAINT "routine_teacher_subjects_teacher_id_subject_id_pk" PRIMARY KEY("teacher_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "routine_teachers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"short_name" text NOT NULL,
	"gender" "routine_gender" NOT NULL,
	"designation" text DEFAULT '' NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"qualification" text DEFAULT '' NOT NULL,
	"experience_years" real,
	"phone" text DEFAULT '' NOT NULL,
	"salary" integer,
	"target_periods" integer,
	"bio" text DEFAULT '' NOT NULL,
	"erp_id" text,
	"is_vacancy" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routine_absences" ADD CONSTRAINT "routine_absences_teacher_id_routine_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."routine_teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_routine_id_routine_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routine_routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_group_id_routine_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."routine_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_period_id_routine_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."routine_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_subject_id_routine_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."routine_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_teacher_id_routine_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."routine_teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_ta_id_routine_teachers_id_fk" FOREIGN KEY ("ta_id") REFERENCES "public"."routine_teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_room_id_routine_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."routine_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_groups" ADD CONSTRAINT "routine_groups_default_room_id_routine_rooms_id_fk" FOREIGN KEY ("default_room_id") REFERENCES "public"."routine_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_periods" ADD CONSTRAINT "routine_periods_routine_id_routine_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routine_routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_proxies" ADD CONSTRAINT "routine_proxies_assignment_id_routine_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."routine_assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_proxies" ADD CONSTRAINT "routine_proxies_period_id_routine_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."routine_periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_proxies" ADD CONSTRAINT "routine_proxies_proxy_teacher_id_routine_teachers_id_fk" FOREIGN KEY ("proxy_teacher_id") REFERENCES "public"."routine_teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_slots" ADD CONSTRAINT "routine_slots_assignment_id_routine_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."routine_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_teacher_subjects" ADD CONSTRAINT "routine_teacher_subjects_teacher_id_routine_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."routine_teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_teacher_subjects" ADD CONSTRAINT "routine_teacher_subjects_subject_id_routine_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."routine_subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "routine_absences_uq" ON "routine_absences" USING btree ("date","teacher_id");--> statement-breakpoint
CREATE INDEX "routine_assignments_routine_idx" ON "routine_assignments" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "routine_periods_routine_idx" ON "routine_periods" USING btree ("routine_id");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_proxies_slot_uq" ON "routine_proxies" USING btree ("date","assignment_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_proxies_teacher_uq" ON "routine_proxies" USING btree ("date","period_id","proxy_teacher_id");--> statement-breakpoint
CREATE INDEX "routine_proxies_date_idx" ON "routine_proxies" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_routines_one_active_uq" ON "routine_routines" USING btree ("status") WHERE "routine_routines"."status" = 'active';--> statement-breakpoint
CREATE INDEX "routine_slots_assignment_idx" ON "routine_slots" USING btree ("assignment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_teachers_short_name_uq" ON "routine_teachers" USING btree (lower("short_name")) WHERE "routine_teachers"."active";
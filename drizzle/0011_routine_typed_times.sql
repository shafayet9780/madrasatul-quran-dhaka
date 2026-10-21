CREATE TYPE "public"."routine_placement" AS ENUM('class', 'own_room', 'seated');--> statement-breakpoint
CREATE TABLE "routine_class_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"placement" "routine_placement" NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "routine_class_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "routine_absences" ADD COLUMN "times" jsonb;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD COLUMN "host_group_id" uuid;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD COLUMN "starts_at" smallint;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD COLUMN "ends_at" smallint;--> statement-breakpoint
ALTER TABLE "routine_groups" ADD COLUMN "type_id" uuid;--> statement-breakpoint
ALTER TABLE "routine_proxies" ADD COLUMN "starts_at" smallint;--> statement-breakpoint
ALTER TABLE "routine_proxies" ADD COLUMN "ends_at" smallint;--> statement-breakpoint
ALTER TABLE "routine_slots" ADD COLUMN "starts_at" smallint;--> statement-breakpoint
ALTER TABLE "routine_slots" ADD COLUMN "ends_at" smallint;--> statement-breakpoint
ALTER TABLE "routine_subjects" ADD COLUMN "type_id" uuid;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_host_group_id_routine_groups_id_fk" FOREIGN KEY ("host_group_id") REFERENCES "public"."routine_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_groups" ADD CONSTRAINT "routine_groups_type_id_routine_class_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."routine_class_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_subjects" ADD CONSTRAINT "routine_subjects_type_id_routine_class_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."routine_class_types"("id") ON DELETE no action ON UPDATE no action;
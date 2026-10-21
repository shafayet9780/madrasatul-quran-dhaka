-- Class routine: typed times instead of periods, class types, rooms by row (docs/class-routine.md).
-- The seeded classes and periods are deleted (owner, 2026-10-21); teachers, groups, subjects, rooms,
-- absences and proxy history stay.
INSERT INTO "routine_class_types" ("name", "placement", "sort") VALUES ('জেনারেল', 'class', 0), ('হিফয', 'own_room', 1), ('নাজেরা', 'own_room', 2), ('কুরআন', 'seated', 3), ('আরবি', 'seated', 4);--> statement-breakpoint
UPDATE "routine_groups" g SET "type_id" = t."id" FROM "routine_class_types" t
WHERE t."name" = CASE WHEN g."section" IN ('হিফয', 'নাজেরা', 'কুরআন', 'আরবি') THEN g."section" ELSE 'জেনারেল' END;--> statement-breakpoint
ALTER TABLE "routine_subjects" DROP CONSTRAINT "routine_subjects_name_unique";--> statement-breakpoint
-- A subject used under several types becomes one subject per type; its teachers keep each copy.
-- Names are matched ignoring case (the new unique index is on lower(name) per type).
INSERT INTO "routine_subjects" ("name", "sort", "active", "type_id")
SELECT DISTINCT ON (lower(s."name"), g."type_id") s."name", s."sort", s."active", g."type_id" FROM "routine_assignments" a
JOIN "routine_subjects" s ON s."id" = a."subject_id" JOIN "routine_groups" g ON g."id" = a."group_id"
ORDER BY lower(s."name"), g."type_id", s."name";--> statement-breakpoint
INSERT INTO "routine_teacher_subjects" ("teacher_id", "subject_id")
SELECT ts."teacher_id", n."id" FROM "routine_teacher_subjects" ts
JOIN "routine_subjects" o ON o."id" = ts."subject_id" AND o."type_id" IS NULL
JOIN "routine_subjects" n ON lower(n."name") = lower(o."name") AND n."type_id" IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "routine_proxies" x SET "starts_at" = p."starts_at", "ends_at" = p."ends_at" FROM "routine_periods" p WHERE p."id" = x."period_id";--> statement-breakpoint
-- An absence for chosen periods keeps their times; with none found it is the whole day.
UPDATE "routine_absences" a SET "times" = (
  SELECT jsonb_agg(jsonb_build_object('startsAt', p."starts_at", 'endsAt', p."ends_at") ORDER BY p."starts_at")
  FROM "routine_periods" p WHERE p."id" = ANY(a."period_ids")
) WHERE a."period_ids" IS NOT NULL;--> statement-breakpoint
DELETE FROM "routine_assignments";--> statement-breakpoint
-- Today's and later proxies were for those lessons (past ones stay as history, as in the app).
DELETE FROM "routine_proxies" WHERE "assignment_id" IS NULL AND "date" >= (now() AT TIME ZONE 'Asia/Dhaka')::date;--> statement-breakpoint
DELETE FROM "routine_subjects" o WHERE o."type_id" IS NULL AND EXISTS (SELECT 1 FROM "routine_subjects" n WHERE lower(n."name") = lower(o."name") AND n."type_id" IS NOT NULL);--> statement-breakpoint
-- Unused subjects that differ only in case ("Art", "art") become one, keeping every teacher.
INSERT INTO "routine_teacher_subjects" ("teacher_id", "subject_id")
SELECT ts."teacher_id", k."id" FROM "routine_teacher_subjects" ts
JOIN "routine_subjects" o ON o."id" = ts."subject_id" AND o."type_id" IS NULL
JOIN LATERAL (SELECT x."id" FROM "routine_subjects" x WHERE x."type_id" IS NULL AND lower(x."name") = lower(o."name") ORDER BY x."name", x."id" LIMIT 1) k ON k."id" <> o."id"
ON CONFLICT DO NOTHING;--> statement-breakpoint
DELETE FROM "routine_subjects" o WHERE o."type_id" IS NULL AND EXISTS (SELECT 1 FROM "routine_subjects" x WHERE x."type_id" IS NULL AND lower(x."name") = lower(o."name") AND (x."name", x."id") < (o."name", o."id"));--> statement-breakpoint
UPDATE "routine_subjects" SET "type_id" = (SELECT "id" FROM "routine_class_types" WHERE "name" = 'জেনারেল') WHERE "type_id" IS NULL;--> statement-breakpoint
ALTER TABLE "routine_assignments" DROP CONSTRAINT "routine_assignments_period_id_routine_periods_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_assignments" DROP CONSTRAINT "routine_assignments_room_id_routine_rooms_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_proxies" DROP CONSTRAINT "routine_proxies_period_id_routine_periods_id_fk";
--> statement-breakpoint
DROP INDEX "routine_proxies_teacher_uq";--> statement-breakpoint
ALTER TABLE "routine_slots" DROP CONSTRAINT "routine_slots_routine_id_period_id_day_kind_ref_id_pk";--> statement-breakpoint
ALTER TABLE "routine_assignments" ALTER COLUMN "starts_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "routine_assignments" ALTER COLUMN "ends_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "routine_groups" ALTER COLUMN "type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "routine_slots" ALTER COLUMN "starts_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "routine_slots" ALTER COLUMN "ends_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "routine_slots" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "routine_subjects" ALTER COLUMN "type_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "routine_subjects_type_name_uq" ON "routine_subjects" USING btree ("type_id",lower("name"));--> statement-breakpoint
ALTER TABLE "routine_absences" DROP COLUMN "period_ids";--> statement-breakpoint
ALTER TABLE "routine_assignments" DROP COLUMN "period_id";--> statement-breakpoint
ALTER TABLE "routine_assignments" DROP COLUMN "room_id";--> statement-breakpoint
ALTER TABLE "routine_assignments" DROP COLUMN "note";--> statement-breakpoint
ALTER TABLE "routine_groups" DROP COLUMN "kind";--> statement-breakpoint
ALTER TABLE "routine_groups" DROP COLUMN "section";--> statement-breakpoint
ALTER TABLE "routine_groups" DROP COLUMN "band";--> statement-breakpoint
ALTER TABLE "routine_proxies" DROP COLUMN "period_id";--> statement-breakpoint
ALTER TABLE "routine_rooms" DROP COLUMN "shared";--> statement-breakpoint
ALTER TABLE "routine_slots" DROP COLUMN "period_id";--> statement-breakpoint
DROP TABLE "routine_periods" CASCADE;--> statement-breakpoint
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_time_ck" CHECK ("routine_assignments"."ends_at" > "routine_assignments"."starts_at" AND "routine_assignments"."starts_at" >= 0 AND "routine_assignments"."ends_at" <= 1440);--> statement-breakpoint
DROP TYPE "public"."routine_group_kind";--> statement-breakpoint
DROP TYPE "public"."routine_slot_kind";--> statement-breakpoint
-- The clash guards: overlapping times of one routine, day, kind and ref may not both be booked;
-- a proxy teacher covers one class at a time on a date.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "routine_slots" ADD CONSTRAINT "routine_slots_no_overlap" EXCLUDE USING gist ("routine_id" WITH =, "day" WITH =, "kind" WITH =, "ref_id" WITH =, int4range("starts_at", "ends_at") WITH &&);--> statement-breakpoint
-- Periods let one teacher cover two overlapping periods on a date; the later of such proxies keeps
-- no time (it stays as history, with its snapshot).
UPDATE "routine_proxies" p SET "starts_at" = NULL, "ends_at" = NULL WHERE p."starts_at" IS NOT NULL AND EXISTS (SELECT 1 FROM "routine_proxies" q WHERE q."date" = p."date" AND q."proxy_teacher_id" = p."proxy_teacher_id" AND q."id" <> p."id" AND q."starts_at" IS NOT NULL AND (q."starts_at", q."id") < (p."starts_at", p."id") AND int4range(q."starts_at", q."ends_at") && int4range(p."starts_at", p."ends_at"));--> statement-breakpoint
ALTER TABLE "routine_proxies" ADD CONSTRAINT "routine_proxies_teacher_no_overlap" EXCLUDE USING gist ("date" WITH =, "proxy_teacher_id" WITH =, int4range("starts_at", "ends_at") WITH &&) WHERE ("starts_at" IS NOT NULL);

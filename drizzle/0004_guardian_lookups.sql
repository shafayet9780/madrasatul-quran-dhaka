CREATE TABLE "survey_lookups" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"round_id" uuid NOT NULL,
	"class_key" text NOT NULL,
	"section_key" text DEFAULT '' NOT NULL,
	"by" text NOT NULL,
	"input_tail" text NOT NULL,
	"matched" text[] DEFAULT '{}'::text[] NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "answer_items" ADD COLUMN "verified" boolean;--> statement-breakpoint
ALTER TABLE "survey_lookups" ADD CONSTRAINT "survey_lookups_round_id_survey_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."survey_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "survey_lookups_created_idx" ON "survey_lookups" USING btree ("created_at");
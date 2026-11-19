ALTER TABLE "admission_cycles" ADD COLUMN "last_eval_receipt" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "eval_receipt_no" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "eval_receipt_printed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "eval_receipt_date" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "applications_eval_receipt_uq" ON "applications" USING btree ("cycle_id","eval_receipt_no");--> statement-breakpoint
-- Fees marked received before receipts existed get numbers in the order they were received.
WITH numbered AS (
  SELECT id, row_number() OVER (PARTITION BY cycle_id ORDER BY eval_fee_received_at, id) AS no
  FROM "applications"
  WHERE eval_fee_received_at IS NOT NULL AND public_ref IS NOT NULL AND NOT is_test
)
UPDATE "applications" a SET eval_receipt_no = numbered.no FROM numbered WHERE a.id = numbered.id;--> statement-breakpoint
UPDATE "admission_cycles" c SET last_eval_receipt = coalesce((SELECT max(eval_receipt_no) FROM "applications" WHERE cycle_id = c.id), 0);
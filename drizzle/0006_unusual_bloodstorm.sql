ALTER TABLE "articles" ADD COLUMN "plain_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || coalesce(excerpt, '') || ' ' || plain_text)) STORED;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || role || ' ' || coalesce(phone, '') || ' ' || coalesce(email, '') || ' ' || coalesce(coverage, ''))) STORED;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', title)) STORED;--> statement-breakpoint
CREATE INDEX "articles_search_idx" ON "articles" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "contacts_search_idx" ON "contacts" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "documents_search_idx" ON "documents" USING gin ("search_vector");
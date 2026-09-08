CREATE TABLE "qr_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar(512) NOT NULL,
	"url" varchar(2048) NOT NULL,
	"user_id" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL
);

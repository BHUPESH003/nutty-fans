-- AlterTable
ALTER TABLE "posts" ADD COLUMN "preview_config" JSONB NOT NULL DEFAULT '{"type":"none"}';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "overlays" JSONB NOT NULL DEFAULT '[]'::jsonb;


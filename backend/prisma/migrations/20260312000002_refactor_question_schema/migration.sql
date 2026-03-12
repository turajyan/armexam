-- ─── Section: add category column ────────────────────────────────────────────
ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'READING';

-- ─── Question: add new unified columns ───────────────────────────────────────
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "contextText" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "media"       JSONB;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "prompt"      TEXT NOT NULL DEFAULT '';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "content"     JSONB;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "config"      JSONB;

-- Migrate existing data into new columns before dropping old ones ----------

-- prompt ← old text field
UPDATE "Question" SET "prompt" = "text" WHERE "prompt" = '' AND "text" IS NOT NULL;

-- content ← type-specific old fields
UPDATE "Question" SET "content" = jsonb_build_object(
  'options', "options",
  'correct', "correct"
)
WHERE type IN ('single_choice','multi_choice','multi_select','audio','video')
  AND "options" IS NOT NULL;

UPDATE "Question" SET "content" = jsonb_build_object('answer', "answer")
WHERE type = 'fill_blank' AND "answer" IS NOT NULL;

UPDATE "Question" SET "content" = jsonb_build_object(
  'segments', "segments",
  'wordBank', "wordBank"
)
WHERE type = 'fill_wordbank' AND "segments" IS NOT NULL;

UPDATE "Question" SET "content" = jsonb_build_object(
  'minWords', "minWords",
  'maxWords', "maxWords"
)
WHERE type = 'writing';

UPDATE "Question" SET "content" = jsonb_build_object(
  'minSeconds', "minSeconds",
  'maxSeconds', "maxSeconds",
  'maxAttempts', "maxAttempts"
)
WHERE type = 'voice';

-- media ← old audioSrc / videoSrc / imageSrc
UPDATE "Question" SET "media" = jsonb_build_array(
  jsonb_build_object('type', 'audio', 'url', "audioSrc", 'maxPlays', COALESCE("maxPlays", 2))
)
WHERE "audioSrc" IS NOT NULL AND "audioSrc" != '';

UPDATE "Question" SET "media" = COALESCE("media", '[]'::jsonb) || jsonb_build_array(
  jsonb_build_object('type', 'video', 'url', "videoSrc", 'maxPlays', COALESCE("maxPlays", 1))
)
WHERE "videoSrc" IS NOT NULL AND "videoSrc" != '';

UPDATE "Question" SET "media" = COALESCE("media", '[]'::jsonb) || jsonb_build_array(
  jsonb_build_object('type', 'image', 'url', "imageSrc")
)
WHERE "imageSrc" IS NOT NULL AND "imageSrc" != '';

-- Normalise type values to new constants -----------------------------------
UPDATE "Question" SET type = 'SINGLE_CHOICE'    WHERE type IN ('single_choice', 'audio', 'video');
UPDATE "Question" SET type = 'MULTIPLE_CHOICE'  WHERE type IN ('multi_choice', 'multi_select');
UPDATE "Question" SET type = 'FILL_IN_THE_BLANKS' WHERE type = 'fill_blank';
UPDATE "Question" SET type = 'DRAG_TO_TEXT'     WHERE type = 'fill_wordbank';
UPDATE "Question" SET type = 'WRITING_INDEPENDENT' WHERE type = 'writing';
UPDATE "Question" SET type = 'SPEAKING_INDEPENDENT' WHERE type = 'voice';

-- Section category mapping -------------------------------------------------
UPDATE "Section" SET "category" = 'LISTENING' WHERE name IN ('Listening', 'Listening / Watching');
UPDATE "Section" SET "category" = 'SPEAKING'  WHERE name = 'Speaking';
UPDATE "Section" SET "category" = 'WRITING'   WHERE name IN ('Writing', 'Free Writing');
UPDATE "Section" SET "category" = 'READING'   WHERE name IN ('Reading', 'Grammar', 'Vocabulary');

-- ─── Question: drop old columns ───────────────────────────────────────────────
ALTER TABLE "Question"
  DROP COLUMN IF EXISTS "text",
  DROP COLUMN IF EXISTS "options",
  DROP COLUMN IF EXISTS "correct",
  DROP COLUMN IF EXISTS "answer",
  DROP COLUMN IF EXISTS "segments",
  DROP COLUMN IF EXISTS "wordBank",
  DROP COLUMN IF EXISTS "audioSrc",
  DROP COLUMN IF EXISTS "videoSrc",
  DROP COLUMN IF EXISTS "imageSrc",
  DROP COLUMN IF EXISTS "maxPlays",
  DROP COLUMN IF EXISTS "pauseSeconds",
  DROP COLUMN IF EXISTS "maxSeconds",
  DROP COLUMN IF EXISTS "minSeconds",
  DROP COLUMN IF EXISTS "maxAttempts",
  DROP COLUMN IF EXISTS "minWords",
  DROP COLUMN IF EXISTS "maxWords";

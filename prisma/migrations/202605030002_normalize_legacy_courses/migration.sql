ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS courses_source_key_key
  ON public.courses(source_key)
  WHERE source_key IS NOT NULL;

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS chapter_key TEXT,
  ADD COLUMN IF NOT EXISTS section TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS chapters_chapter_key_key
  ON public.chapters(chapter_key)
  WHERE chapter_key IS NOT NULL;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS legacy_lesson_id TEXT,
  ADD COLUMN IF NOT EXISTS full_id TEXT,
  ADD COLUMN IF NOT EXISTS lesson_type TEXT,
  ADD COLUMN IF NOT EXISTS sim_content TEXT,
  ADD COLUMN IF NOT EXISTS content_text TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS lessons_chapter_id_legacy_lesson_id_key
  ON public.lessons(chapter_id, legacy_lesson_id)
  WHERE legacy_lesson_id IS NOT NULL;

UPDATE public.lessons
SET legacy_lesson_id = 'A1',
    full_id = '1-1.1 A1'
WHERE id = '00000000-0000-4000-8000-000000000121'
  AND legacy_lesson_id IS NULL;

WITH normalized_course AS (
  INSERT INTO public.courses (id, title, description, source_key, is_active)
  VALUES (
    '00000000-0000-4000-8000-000000000101',
    '理化課程',
    'Supabase 正規化課程資料',
    'legacy:course_pages',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      source_key = EXCLUDED.source_key,
      is_active = EXCLUDED.is_active
  RETURNING id
),
legacy_pages AS (
  SELECT
    chapter_key,
    section,
    title,
    updated_at,
    row_number() OVER (ORDER BY chapter_key) AS order_index
  FROM public.course_pages
),
upserted_chapters AS (
  INSERT INTO public.chapters (
    id,
    course_id,
    title,
    description,
    chapter_key,
    section,
    order_index,
    is_active,
    created_at
  )
  SELECT
    CASE
      WHEN page.chapter_key = '1-1' THEN '00000000-0000-4000-8000-000000000111'::uuid
      ELSE gen_random_uuid()
    END,
    (SELECT id FROM normalized_course),
    page.chapter_key || ' ' || page.title,
    NULL,
    page.chapter_key,
    page.section,
    page.order_index,
    TRUE,
    COALESCE(page.updated_at, now())
  FROM legacy_pages page
  ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      chapter_key = EXCLUDED.chapter_key,
      section = EXCLUDED.section,
      order_index = EXCLUDED.order_index,
      is_active = EXCLUDED.is_active
  RETURNING id, chapter_key
)
INSERT INTO public.lessons (
  id,
  chapter_id,
  title,
  content_type,
  content_url,
  simulator_config,
  legacy_lesson_id,
  full_id,
  lesson_type,
  sim_content,
  content_text,
  order_index,
  is_active,
  created_at
)
SELECT
  CASE
    WHEN lesson.chapter_key = '1-1' AND lesson.lesson_id = 'A1'
      THEN '00000000-0000-4000-8000-000000000121'::uuid
    ELSE gen_random_uuid()
  END,
  chapter.id,
  lesson.question,
  CASE WHEN lesson.simulator_id IS NULL THEN 'text' ELSE 'simulation' END,
  '/' || lesson.chapter_key,
  lesson.simulator_config,
  lesson.lesson_id,
  lesson.full_id,
  lesson.lesson_type,
  lesson.sim_content,
  lesson.content_text,
  lesson.sort_order,
  TRUE,
  COALESCE(lesson.updated_at, now())
FROM public.course_lessons lesson
JOIN upserted_chapters chapter ON chapter.chapter_key = lesson.chapter_key
ON CONFLICT (chapter_id, legacy_lesson_id) WHERE legacy_lesson_id IS NOT NULL DO UPDATE
SET title = EXCLUDED.title,
    content_type = EXCLUDED.content_type,
    content_url = EXCLUDED.content_url,
    simulator_config = EXCLUDED.simulator_config,
    full_id = EXCLUDED.full_id,
    lesson_type = EXCLUDED.lesson_type,
    sim_content = EXCLUDED.sim_content,
    content_text = EXCLUDED.content_text,
    order_index = EXCLUDED.order_index,
    is_active = EXCLUDED.is_active;

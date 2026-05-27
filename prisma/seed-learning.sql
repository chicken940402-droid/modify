INSERT INTO public.courses (id, title, description, is_active)
VALUES (
  '00000000-0000-4000-8000-000000000101',
  '理化課程',
  '國中理化互動式課程',
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

INSERT INTO public.chapters (id, course_id, title, description, order_index, is_active)
VALUES (
  '00000000-0000-4000-8000-000000000111',
  '00000000-0000-4000-8000-000000000101',
  '1-1 長度與體積的測量',
  '長度單位、測量結果與尺規操作',
  1,
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    order_index = EXCLUDED.order_index,
    is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (
  id,
  chapter_id,
  title,
  content_type,
  content_url,
  simulator_config,
  order_index,
  is_active
)
VALUES (
  '00000000-0000-4000-8000-000000000121',
  '00000000-0000-4000-8000-000000000111',
  '1公分在哪裡？',
  'simulation',
  '/1-1',
  '{
    "type": "ruler_click",
    "question": "1公分在哪裡？",
    "target_value": 1,
    "unit": "cm",
    "range": [0, 20],
    "correct_zone": [0.9, 1.1],
    "hint": "1公分 = 1cm"
  }'::jsonb,
  1,
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    content_type = EXCLUDED.content_type,
    content_url = EXCLUDED.content_url,
    simulator_config = EXCLUDED.simulator_config,
    order_index = EXCLUDED.order_index,
    is_active = EXCLUDED.is_active;

INSERT INTO public.quizzes (id, chapter_id, title, passing_score, is_active)
VALUES (
  '00000000-0000-4000-8000-000000000131',
  '00000000-0000-4000-8000-000000000111',
  '1-1 單元測驗',
  60,
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    passing_score = EXCLUDED.passing_score,
    is_active = EXCLUDED.is_active;

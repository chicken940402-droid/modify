WITH chapter_ref AS (
  SELECT id FROM public.chapters WHERE chapter_key = '1-2.2'
), lesson_seed (legacy_lesson_id, full_id, lesson_type, title, sim_content, content_text, order_index) AS (
  VALUES
    ('A','1-2.2 A','觀念','質量的單位有哪些？','單位卡片：毫克、克、公斤、公噸，由小到大排列','常用質量單位：mg、g、kg、t',1),
    ('A1','1-2.2 A1','體感','生活中哪些物品適合用克(g)表示？','拖曳物品到 g 單位：橡皮擦、鉛筆、飲料罐','克(g)是日常小物常用的質量單位',2),
    ('A2','1-2.2 A2','體感','哪些物品適合用公斤(kg)表示？','拖曳物品到 kg 單位：書包、人、米袋','公斤(kg)常用來表示較重物體的質量',3),
    ('A3','1-2.2 A3','邏輯','1公斤等於幾公克？','單位換算階梯：kg → g，數字乘以1000','1 kg = 1000 g',4),
    ('A4','1-2.2 A4','邏輯','1公克等於幾毫克？','單位換算階梯：g → mg，數字乘以1000','1 g = 1000 mg',5),
    ('A3XA4','1-2.2 A3XA4','邏輯','kg、g、mg 連續換算','輸入 2 kg、0.5 g，轉成指定單位','大單位換小單位用乘法；小單位換大單位用除法',6)
)
INSERT INTO public.lessons (
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
  is_active
)
SELECT
  chapter_ref.id,
  lesson.title,
  CASE WHEN lesson.lesson_type = '觀念' THEN 'text' ELSE 'simulation' END,
  '/1-2.2',
  jsonb_build_object(
    'source', 'mass_units_seed',
    'type', lesson.lesson_type,
    'prompt', lesson.title,
    'simulation', lesson.sim_content,
    'keyword', lesson.content_text
  ),
  lesson.legacy_lesson_id,
  lesson.full_id,
  lesson.lesson_type,
  lesson.sim_content,
  lesson.content_text,
  lesson.order_index,
  TRUE
FROM lesson_seed lesson
CROSS JOIN chapter_ref
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

-- ============================================================
-- 1. Agregar columna subtasks a chores
-- ============================================================
ALTER TABLE public.chores ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT NULL;


-- ============================================================
-- 2. Poblar subtareas por nombre de tarea
--    Ajusta los puntos según lo que acordaron
-- ============================================================

-- BARRER
UPDATE public.chores SET subtasks = '[
  {"name": "Cocina",              "points": 2},
  {"name": "Living 3290",         "points": 2},
  {"name": "Living 3294",         "points": 2},
  {"name": "Entre casas (mesón)", "points": 2},
  {"name": "Terraza",             "points": 2},
  {"name": "Pasillos",            "points": 1}
]' WHERE name = 'Barrer';

-- ASPIRAR
UPDATE public.chores SET subtasks = '[
  {"name": "Casa 3290 completa",  "points": 5},
  {"name": "Casa 3294 completa",  "points": 5}
]' WHERE name = 'Aspirar';

-- LIMPIAR BAÑOS (si tienes una tarea genérica "Limpiar Baño")
-- Si tienes tareas separadas por baño, ignora esto
UPDATE public.chores SET subtasks = '[
  {"name": "Baño visitas 3290",       "points": 3},
  {"name": "Baño matrimonial 3290",   "points": 4},
  {"name": "Baño 2do piso 3290",      "points": 3},
  {"name": "Baño visitas 3294",       "points": 3},
  {"name": "Baño taller 3294",        "points": 2},
  {"name": "Baño 2do piso 3294",      "points": 3}
]' WHERE name ILIKE '%baño%' OR name ILIKE '%bano%';

-- VENTANAS
UPDATE public.chores SET subtasks = '[
  {"name": "Living 3290", "points": 3},
  {"name": "Living 3294", "points": 3},
  {"name": "Cocina",      "points": 2},
  {"name": "Entre casas", "points": 2}
]' WHERE name ILIKE '%ventana%' OR name ILIKE '%vidrio%';

-- LAVAR LOZA
UPDATE public.chores SET subtasks = '[
  {"name": "Tanda chica",  "points": 2},
  {"name": "Tanda mediana","points": 4},
  {"name": "Tanda grande", "points": 6}
]' WHERE name ILIKE '%loz%' AND name ILIKE '%lav%';

-- GUARDAR LOZA
UPDATE public.chores SET subtasks = '[
  {"name": "Tanda chica",  "points": 2},
  {"name": "Tanda mediana","points": 4},
  {"name": "Tanda grande", "points": 6}
]' WHERE name ILIKE '%loz%' AND name ILIKE '%guard%';


-- ============================================================
-- 3. Verificar resultado
-- ============================================================
SELECT name, emoji, points, subtasks
FROM public.chores
WHERE subtasks IS NOT NULL
ORDER BY name;

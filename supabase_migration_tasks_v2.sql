-- Migração: Adiciona colunas novas à tabela tasks
-- Execute no SQL Editor do Supabase

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS negociacao     TEXT,
  ADD COLUMN IF NOT EXISTS status         TEXT DEFAULT 'Pendente',
  ADD COLUMN IF NOT EXISTS datacriacao    DATE,
  ADD COLUMN IF NOT EXISTS horacriacao    TIME,
  ADD COLUMN IF NOT EXISTS dataconclusao  DATE,
  ADD COLUMN IF NOT EXISTS horaconclusao  TIME;

-- Popula o campo status com base no valor atual de 'concluida'
UPDATE tasks
SET status = CASE
  WHEN concluida = TRUE THEN 'Concluída'
  ELSE 'Pendente'
END
WHERE status IS NULL;

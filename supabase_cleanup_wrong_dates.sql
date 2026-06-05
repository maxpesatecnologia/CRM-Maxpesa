-- =============================================================================
-- LIMPEZA: Negócios importados com data de criação errada
-- Execute no Supabase > SQL Editor
-- =============================================================================

-- PASSO 1: Revise os registros antes de deletar
-- Veja quantos negócios têm dataCriacao = hoje (data da importação errada)
SELECT
  id,
  empresa,
  "nomeNegocacao",
  datacriacao,
  created_at,
  vendedor,
  etapaid
FROM deals
WHERE datacriacao = CURRENT_DATE
ORDER BY created_at DESC;

-- =============================================================================
-- PASSO 2: Somente execute o DELETE abaixo APÓS revisar o SELECT acima
--          e confirmar que são os registros corretos a remover.
-- =============================================================================

-- DELETE FROM deals
-- WHERE datacriacao = CURRENT_DATE
--   AND created_at::date = CURRENT_DATE;

-- =============================================================================
-- Após deletar, use o botão "Importar Planilha" no Funil de Vendas do CRM
-- para reimportar com as datas corretas da planilha original.
-- =============================================================================

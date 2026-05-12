-- 1. Tabela de Contatos (Empresas)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  empresa TEXT NOT NULL,
  documento TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  cep TEXT,
  uf TEXT,
  telefone TEXT,
  celular TEXT,
  contatos TEXT,
  email TEXT,
  segmento TEXT,
  vendedor TEXT
);

-- 2. Tabela de Frota/Produtos
CREATE TABLE IF NOT EXISTS fleet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC DEFAULT 0,
  exibirNaNegociacao BOOLEAN DEFAULT TRUE
);

-- 3. Tabela de Negociações (Deals)
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  empresa TEXT NOT NULL,
  nomeNegocacao TEXT,
  valorUnico NUMERIC DEFAULT 0,
  valorRecorrente NUMERIC DEFAULT 0,
  fonte TEXT,
  campanha TEXT,
  etapaId TEXT DEFAULT 'etapa-1',
  motivoPerda TEXT,
  dataCriacao DATE DEFAULT CURRENT_DATE,
  dataFechamento DATE,
  produto TEXT,
  vendedor TEXT,
  anexo TEXT,
  anexoNome TEXT
);

-- 4. Tabela de Tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  titulo TEXT,
  assunto TEXT,
  empresa TEXT,
  dataAgendamento DATE,
  horario TIME,
  tipoTarefa TEXT,
  vendedor TEXT,
  concluida BOOLEAN DEFAULT FALSE,
  descricao TEXT
);

-- 5. Tabela de Usuários (Opcional, se não usar Auth built-in por enquanto)
CREATE TABLE IF NOT EXISTS users_crm (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  perfil TEXT DEFAULT 'Usuário',
  status TEXT DEFAULT 'Ativo'
);

-- 6. Tabela de Campanhas
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nome TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'Ativa',
  dataInicio DATE,
  dataFim DATE
);

-- 7. Tabela de Origens de Lead
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nome TEXT NOT NULL
);

-- 8. Tabela de Segmentos
CREATE TABLE IF NOT EXISTS segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nome TEXT NOT NULL
);

-- 9. Tabela de Motivos de Perda
CREATE TABLE IF NOT EXISTS loss_reasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nome TEXT NOT NULL
);

-- 10. Tabela de Contatos Individuais (Pessoas)
CREATE TABLE IF NOT EXISTS individual_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  company_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  job_title TEXT,
  phones JSONB DEFAULT '[]'::jsonb,
  emails JSONB DEFAULT '[]'::jsonb,
  vendedor TEXT
);

-- 11. Tabela de Anexos
CREATE TABLE IF NOT EXISTS attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size NUMERIC,
  file_type TEXT,
  uploaded_by TEXT
);

-- Desabilitar RLS para todas as tabelas (Desenvolvimento)
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE fleet DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE users_crm DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE loss_reasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE individual_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;


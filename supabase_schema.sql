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
  contatos TEXT,
  email TEXT,
  segmento TEXT
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
  valorUnico NUMERIC DEFAULT 0,
  valorRecorrente NUMERIC DEFAULT 0,
  fonte TEXT,
  campanha TEXT,
  etapaId TEXT DEFAULT 'etapa-1',
  motivoPerda TEXT,
  dataCriacao DATE DEFAULT CURRENT_DATE,
  dataFechamento DATE,
  produto TEXT
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

-- Habilitar RLS (Opcional para teste inicial, mas recomendado desabilitar ou criar políticas para anon access)
-- Por simplicidade inicial, você pode desabilitar o RLS ou rodar:
-- ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleet DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE users_crm DISABLE ROW LEVEL SECURITY;

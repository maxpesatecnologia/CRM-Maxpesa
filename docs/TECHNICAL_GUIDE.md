# Guia Técnico: RD Station CRM Clone

Este documento fornece uma visão aprofundada da arquitetura técnica, estrutura de dados e fluxos do sistema do RD Station CRM Clone.

## 1. Arquitetura Geral

O projeto é uma Single Page Application (SPA) moderna, construída com foco em performance e tempo real.

- **Framework**: React 19 executado via Vite.
- **Backend-as-a-Service**: Supabase.
- **Gerenciamento de Estado**: React Context API.
- **Roteamento**: React Router 7.
- **Estilização**: CSS Vanilla com Variáveis Globais (`index.css`).

## 2. Estrutura do Banco de Dados (Supabase)

O banco de dados utiliza PostgreSQL. Abaixo estão as principais tabelas e suas finalidades:

### `contacts` (Empresas/Contatos)
Armazena os dados das empresas e contatos principais.
- `empresa` (TEXT): Nome da organização.
- `vendedor` (TEXT): Nome do responsável associado.
- Campos de endereço, telefone, e-mail e segmento.

### `deals` (Negociações)
A tabela central do CRM, representando oportunidades no pipeline.
- `etapaId` (TEXT): ID da etapa no Kanban (ex: 'etapa-1').
- `valorUnico`/`valorRecorrente` (NUMERIC): Campos financeiros.
- `motivoPerda` (TEXT): Armazena a razão caso o negócio seja perdido.
- `vendedor` (TEXT): Dono da negociação.

### `tasks` (Tarefas/Agendamentos)
Gerencia as atividades relacionadas a cada cliente.
- `dataAgendamento` (DATE) e `horario` (TIME).
- `tipoTarefa` (TEXT): Reunião, E-mail, Ligação, etc.
- `concluida` (BOOLEAN): Status da atividade.

### Outras Tabelas de Suporte
- `fleet`: Catálogo de produtos/serviços.
- `campaigns`, `lead_sources`, `segments`, `loss_reasons`: Dados para filtragem e estatísticas.

## 3. Gerenciamento de Estado

O sistema utiliza dois contextos principais localizados em `src/context/`:

1.  **AuthContext**: Gerencia o estado de autenticação do vendedor logado e o perfil do usuário.
2.  **CRMContext**: Atua como o "cérebro" da aplicação, lidando com:
    - Sincronização em tempo real com o Supabase.
    - Funções de CRUD (Create, Read, Update, Delete) para todas as tabelas.
    - Lógica de movimentação de cards no Pipeline.

## 4. O Pipeline (Kanban)

Localizado em `src/pages/Pipeline.jsx`, o pipeline utiliza a biblioteca `@dnd-kit` para uma experiência de arrastar e soltar suave.

- **Fluxo de Movimentação**: Quando um card é movido, o sistema atualiza o campo `etapaId` na tabela `deals` instantaneamente.
- **Cálculos**: Os valores totais no topo de cada coluna são calculados dinamicamente somando o valor único e recorrente de todos os negócios naquela etapa.

## 5. Exportação e Relatórios

O sistema suporta exportação de dados em dois formatos principais:
- **XLSX (Excel)**: Utiliza a biblioteca `xlsx` para gerar planilhas de contatos e negócios.
- **PDF**: Utiliza `jspdf` e `jspdf-autotable` para gerar documentos formatados de relatórios.

## 6. Configurações e Customização

Muitos elementos do CRM são dinâmicos e podem ser alterados via interface de configurações (Fontes, Segmentos, Motivos de Perda), que são refletidos em todo o sistema através do `CRMContext`.

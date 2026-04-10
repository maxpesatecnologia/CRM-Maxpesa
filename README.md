# RD Station CRM Clone 🚀

Bem-vindo ao clone do **RD Station CRM**, uma ferramenta poderosa de gestão de vendas projetada para ajudar vendedores a organizar suas negociações, contatos e tarefas de forma eficiente.

## 📋 Visão Geral

Este projeto é uma aplicação web completa que simula as principais funcionalidades do RD Station CRM, incluindo um pipeline de vendas estilo Kanban, gestão de contatos, dashboard de indicadores e relatórios exportáveis.

## ✨ Funcionalidades Principais

- **Dashboard**: Visualize seus KPIs (Indicadores Chave de Performance) em tempo real com gráficos dinâmicos.
- **Pipeline de Vendas**: Gerencie suas negociações arrastando cards entre etapas customizáveis.
- **Gestão de Contatos**: Cadastro detalhado de empresas e pessoas, com filtros avançados.
- **Agenda de Tarefas**: Nunca perca um compromisso com o sistema de agendamento de reuniões, ligações e tarefas.
- **Relatórios**: Exportação de dados para Excel (XLSX) e geração de relatórios em PDF.
- **Gestão de Usuários**: Controle de acesso e transferência em massa de dados entre vendedores.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Backend/Banco**: [Supabase](https://supabase.com/) (PostgreSQL & Realtime)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Arraste e Solte**: [@dnd-kit](https://dndkit.com/)
- **Gráficos**: [Recharts](https://recharts.org/)

## 🚀 Como Começar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (Versão 18 ou superior)
- Conta no [Supabase](https://supabase.com/)

### Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd rd-station-clone
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com as suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua-url-do-supabase
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
   ```

4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

Acesse o projeto em `http://localhost:5173`.

## 📚 Documentação Adicional

Para detalhes sobre a arquitetura do banco de dados, fluxos internos e manual do desenvolvedor, consulte o nosso:

👉 **[Guia Técnico Completo](docs/TECHNICAL_GUIDE.md)**

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

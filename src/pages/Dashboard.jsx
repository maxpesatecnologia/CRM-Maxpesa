import React from 'react';
import { useCRM } from '../context/CRMContext';
import { Target, TrendingUp, DollarSign, Trophy, Users, CheckSquare, Building2 } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { deals, stages, contacts, tasks, users, fleet } = useCRM();

  // Métricas
  const totalDeals = deals.length;
  const wonDeals = deals.filter(d => d.etapaId === 'etapa-8');
  const wonAmount = wonDeals.reduce((acc, curr) => acc + (Number(curr.valorUnico) || 0), 0);
  const lostDeals = deals.filter(d => d.etapaId === 'etapa-7');
  const inProgressDeals = deals.filter(d => d.etapaId !== 'etapa-8' && d.etapaId !== 'etapa-7');
  const inProgressAmount = inProgressDeals.reduce((acc, curr) => acc + (Number(curr.valorUnico) || 0), 0);
  const pendingTasks = tasks.filter(t => !t.concluida).length;
  const activeUsers = users.filter(u => u.status === 'Ativo').length;

  // Frota em Uso (Equipamentos em negociações ativas)
  const fleetInProgress = new Set(
    inProgressDeals
      .map(d => d.produto)
      .filter(p => fleet.some(f => f.nome === p))
  ).size;
  const totalFleetItems = fleet.length;

  // Distribuição por etapa para gráfico
  const stageData = stages.map(stage => ({
    name: stage.title,
    count: deals.filter(d => d.etapaId === stage.id).length,
    isWon: stage.id === 'etapa-8',
    isLost: stage.id === 'etapa-7',
  }));
  const maxCount = Math.max(...stageData.map(s => s.count), 1);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const MetricCard = ({ title, value, sub, icon, color, borderColor }) => (
    <div className="metric-card" style={{ borderLeft: `4px solid ${borderColor || color}` }}>
      <div className="metric-card-header">
        <span className="metric-title">{title}</span>
        <span className="metric-icon" style={{ color }}>{icon}</span>
      </div>
      <div className="metric-value" style={{ color }}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="text-muted">Visão geral do seu funil e desempenho de vendas.</p>
      </div>

      {/* Cards de Métricas */}
      <div className="metrics-grid">
        <MetricCard
          title="Ganho Total"
          value={formatCurrency(wonAmount)}
          sub={`Em ${wonDeals.length} negociação(ões) vencida(s)`}
          icon={<DollarSign size={20} />}
          color="#10B981"
          borderColor="#10B981"
        />
        <MetricCard
          title="Em Andamento"
          value={formatCurrency(inProgressAmount)}
          sub={`Projetado em ${inProgressDeals.length} negociação(ões)`}
          icon={<TrendingUp size={20} />}
          color="#3B82F6"
          borderColor="#3B82F6"
        />
        <MetricCard
          title="Frota em Negociação"
          value={fleetInProgress}
          sub={`De ${totalFleetItems} itens cadastrados`}
          icon={<Target size={20} />}
          color="#8B5CF6"
          borderColor="#8B5CF6"
        />
        <MetricCard
          title="Oportunidades Ganhas"
          value={wonDeals.length}
          sub={`${formatCurrency(wonAmount)} em negócios fechados`}
          icon={<Trophy size={20} />}
          color="#10B981"
          borderColor="#10B981"
        />
        <MetricCard
          title="Empresas Cadastradas"
          value={contacts.length}
          sub="Na base de clientes"
          icon={<Building2 size={20} />}
          color="#6366F1"
          borderColor="#6366F1"
        />
        <MetricCard
          title="Tarefas Pendentes"
          value={pendingTasks}
          sub={`De ${tasks.length} total de tarefas`}
          icon={<CheckSquare size={20} />}
          color="#F59E0B"
          borderColor="#F59E0B"
        />
      </div>

      {/* Gráfico CSS de barras */}
      <div className="chart-card">
        <h3>Oportunidades por Etapa do Funil</h3>
        <div className="bar-chart">
          {stageData.map((stage, i) => {
            const heightPct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const barColor = stage.isWon ? '#10B981' : stage.isLost ? '#EF4444' : '#FF2A2A';
            return (
              <div key={i} className="bar-col">
                <div className="bar-count">{stage.count}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ height: `${heightPct}%`, backgroundColor: barColor }}
                  />
                </div>
                <div className="bar-label" title={stage.name}>
                  {stage.name.length > 10 ? stage.name.slice(0, 10) + '…' : stage.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumo rápido */}
      <div className="summary-row">
        <div className="summary-card">
          <h4>Equipe Ativa</h4>
          <div className="summary-value">{activeUsers} <span>/ {users.length} usuários</span></div>
        </div>
        <div className="summary-card">
          <h4>Total de Negociações</h4>
          <div className="summary-value">{totalDeals}</div>
        </div>
        <div className="summary-card">
          <h4>Taxa de Conversão</h4>
          <div className="summary-value">
            {totalDeals > 0 ? ((wonDeals.length / totalDeals) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div className="summary-card">
          <h4>Valor Médio por Negócio</h4>
          <div className="summary-value">
            {wonDeals.length > 0 ? formatCurrency(wonAmount / wonDeals.length) : formatCurrency(0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

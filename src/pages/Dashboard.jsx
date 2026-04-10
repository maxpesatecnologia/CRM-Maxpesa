import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { Target, TrendingUp, DollarSign, Trophy, Clock, Building2, Loader2, Filter, X } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { deals, stages, contacts, users, fleet, isLoading } = useCRM();

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');

  const hasFilter = filterVendedor || filterDataInicio || filterDataFim;

  const clearFilters = () => {
    setFilterVendedor('');
    setFilterDataInicio('');
    setFilterDataFim('');
  };

  // Lista de vendedores ativos para o select
  const activeUsers = useMemo(() => users.filter(u => u.status === 'Ativo'), [users]);

  // Deals filtrados
  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      if (filterVendedor && d.vendedor !== filterVendedor) return false;
      const data = d.dataCriacao || '';
      if (filterDataInicio && data < filterDataInicio) return false;
      if (filterDataFim   && data > filterDataFim)   return false;
      return true;
    });
  }, [deals, filterVendedor, filterDataInicio, filterDataFim]);

  // ── Métricas ──────────────────────────────────────────────────────────────
  const totalDeals       = filteredDeals.length;
  const wonDeals         = filteredDeals.filter(d => d.etapaId === 'etapa-8');
  const wonAmount        = wonDeals.reduce((acc, curr) => acc + (Number(curr.valorUnico) || 0), 0);
  const inProgressDeals  = filteredDeals.filter(d => d.etapaId !== 'etapa-8' && d.etapaId !== 'etapa-7');
  const inProgressAmount = inProgressDeals.reduce((acc, curr) => acc + (Number(curr.valorUnico) || 0), 0);

  // Frota em Negociação
  const fleetInProgress = new Set(
    inProgressDeals.map(d => d.produto).filter(p => fleet.some(f => f.nome === p))
  ).size;

  // ── Tempo Médio até a Venda ───────────────────────────────────────────────
  const avgDaysToClose = useMemo(() => {
    const closed = wonDeals.filter(d => {
      const inicio = d.dataCriacao;
      const fim    = d.dataFechamento;
      return inicio && fim;
    });
    if (closed.length === 0) return null;
    const totalDays = closed.reduce((acc, d) => {
      const inicio = new Date(d.dataCriacao);
      const fim    = new Date(d.dataFechamento);
      const diff   = Math.max(0, Math.round((fim - inicio) / (1000 * 60 * 60 * 24)));
      return acc + diff;
    }, 0);
    return Math.round(totalDays / closed.length);
  }, [wonDeals]);

  // ── Base do Cálculo de Conversão (Somente Etapa "Lead Gerado") ──
  const conversionBase = filteredDeals.filter(d => d.etapaId === 'etapa-1').length;

  const stageData = stages.map(stage => {
    const count = filteredDeals.filter(d => d.etapaId === stage.id).length;
    return {
      name:   stage.title,
      count:  count,
      conversion: conversionBase > 0 ? ((count / conversionBase) * 100).toFixed(1) : 0,
      isWon:  stage.id === 'etapa-8',
      isLost: stage.id === 'etapa-7',
    };
  });
  const maxCount = Math.max(...stageData.map(s => s.count), 1);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const MetricCard = ({ title, value, sub, icon, color }) => (
    <div className="metric-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="metric-card-header">
        <span className="metric-title">{title}</span>
        <span className="metric-icon" style={{ color }}>{icon}</span>
      </div>
      <div className="metric-value" style={{ color }}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 100px)' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-color)' }} />
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">

      {/* ── Cabeçalho com Filtros ── */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Visão geral do funil e desempenho de vendas.</p>
        </div>

        <div className="dashboard-filters">
          <div className="filter-group">
            <Filter size={14} className="filter-icon" />
            <label>Vendedor</label>
            <select
              value={filterVendedor}
              onChange={e => setFilterVendedor(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos</option>
              {activeUsers.map(u => (
                <option key={u.id} value={u.nome}>{u.nome}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>De</label>
            <input
              type="date"
              value={filterDataInicio}
              onChange={e => setFilterDataInicio(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Até</label>
            <input
              type="date"
              value={filterDataFim}
              onChange={e => setFilterDataFim(e.target.value)}
              className="filter-input"
            />
          </div>

          {hasFilter && (
            <button className="filter-clear-btn" onClick={clearFilters} title="Limpar filtros">
              <X size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      {hasFilter && (
        <div className="filter-badge">
          Exibindo resultados filtrados
          {filterVendedor  && <span>· Vendedor: <strong>{filterVendedor}</strong></span>}
          {filterDataInicio && <span>· De: <strong>{filterDataInicio}</strong></span>}
          {filterDataFim    && <span>· Até: <strong>{filterDataFim}</strong></span>}
        </div>
      )}

      {/* ── Cards de Métricas ── */}
      <div className="metrics-grid">
        <MetricCard
          title="Ganho Total"
          value={formatCurrency(wonAmount)}
          sub={`Em ${wonDeals.length} negociação(ões) vencida(s)`}
          icon={<DollarSign size={20} />}
          color="#10B981"
        />
        <MetricCard
          title="Em Andamento"
          value={formatCurrency(inProgressAmount)}
          sub={`Projetado em ${inProgressDeals.length} negociação(ões)`}
          icon={<TrendingUp size={20} />}
          color="#3B82F6"
        />
        <MetricCard
          title="Frota em Negociação"
          value={fleetInProgress}
          sub={`De ${fleet.length} itens cadastrados`}
          icon={<Target size={20} />}
          color="#8B5CF6"
        />
        <MetricCard
          title="Oportunidades Ganhas"
          value={wonDeals.length}
          sub={`${formatCurrency(wonAmount)} em negócios fechados`}
          icon={<Trophy size={20} />}
          color="#10B981"
        />
        <MetricCard
          title="Empresas Cadastradas"
          value={contacts.length}
          sub="Na base de clientes"
          icon={<Building2 size={20} />}
          color="#6366F1"
        />
        <MetricCard
          title="Tempo Médio até a Venda"
          value={avgDaysToClose !== null ? `${avgDaysToClose} dias` : '—'}
          sub={
            avgDaysToClose !== null
              ? `Calculado sobre ${wonDeals.filter(d => d.dataCriacao && d.dataFechamento).length} negócio(s) fechado(s)`
              : 'Sem negócios com data de fechamento'
          }
          icon={<Clock size={20} />}
          color="#F59E0B"
        />
      </div>

      {/* ── Taxas de Conversão por Etapa ── */}
      <div className="conversion-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-title">Eficiência (Sobre {conversionBase} Leads Gerados)</h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Cálculo: Etapa / Leads Gerados</span>
        </div>
        <div className="conversion-grid">
          {stageData.map((stage, i) => (
            <div key={i} className={`conversion-mini-card ${stage.isWon ? 'won' : stage.isLost ? 'lost' : ''}`}>
              <div className="mini-card-label">{stage.name}</div>
              <div className="mini-card-value">
                {stage.conversion}%
              </div>
              <div className="mini-card-bar">
                <div className="mini-card-fill" style={{ width: `${stage.conversion}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gráfico CSS de barras ── */}
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

      {/* ── Resumo rápido ── */}
      <div className="summary-row">
        <div className="summary-card">
          <h4>Equipe Ativa</h4>
          <div className="summary-value">{activeUsers.length} <span>/ {users.length} usuários</span></div>
        </div>
        <div className="summary-card">
          <h4>Total de Negociações</h4>
          <div className="summary-value">{totalDeals}</div>
        </div>
        <div className="summary-card">
          <h4>Taxa de Conversão</h4>
          <div className="summary-value">
            {conversionBase > 0 ? ((wonDeals.length / conversionBase) * 100).toFixed(1) : 0}%
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

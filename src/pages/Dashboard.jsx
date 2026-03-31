import React from 'react';
import { useCRM } from '../context/CRMContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp, DollarSign, Users } from 'lucide-react';

const Dashboard = () => {
  const { deals, stages } = useCRM();

  // Calcula Métricas
  const totalDeals = deals.length;
  const wonDeals = deals.filter(d => d.etapaId === 'etapa-8');
  const wonAmount = wonDeals.reduce((acc, curr) => acc + (Number(curr.valorUnico) || 0), 0);
  
  const lostDeals = deals.filter(d => d.etapaId === 'etapa-7');
  
  const inProgressDeals = deals.filter(d => d.etapaId !== 'etapa-8' && d.etapaId !== 'etapa-7');
  const inProgressAmount = inProgressDeals.reduce((acc, curr) => acc + (Number(curr.valorUnico) || 0), 0);

  // Calcula distribuição por etapa
  const stageDistribution = stages.map(stage => {
    return {
      name: stage.title,
      count: deals.filter(d => d.etapaId === stage.id).length
    };
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Dashboard</h1>
        <p className="text-muted">Visão geral do seu funil e desempenho de vendas.</p>
      </div>

      {/* Cards de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <h3 className="text-sm text-muted font-medium">Ganho Total</h3>
            <DollarSign size={20} color="var(--success-color)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wonAmount)}
          </div>
          <div className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
            Em {wonDeals.length} negociações vencidas
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <h3 className="text-sm text-muted font-medium">Em Andamento</h3>
            <TrendingUp size={20} color="var(--primary-color)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inProgressAmount)}
          </div>
          <div className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
             Projetado em {inProgressDeals.length} negociações
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <h3 className="text-sm text-muted font-medium">Negociações Perdidas</h3>
            <Target size={20} color="var(--danger-color)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
             {lostDeals.length}
          </div>
          <div className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
             Total de negócios declinados ou perdidos
          </div>
        </div>

      </div>

      {/* Gráficos */}
      <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Oportunidades por Etapa</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: 'var(--bg-color)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stageDistribution.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.name === 'Vencemos' ? 'var(--success-color)' : entry.name === 'Perdemos' ? 'var(--danger-color)' : 'var(--primary-color)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

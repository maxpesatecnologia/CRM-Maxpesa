import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, Search, Calendar, Filter, Phone, MessageCircle, FileText, CheckSquare, Info, X, Video, Users, UserCircle2, Hash, ArrowUp, Briefcase, ChevronDown } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './Tasks.css';

const Tasks = () => {
  const { tasks, deals, contacts, users, addTask, updateTask, deleteTask } = useCRM();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [periodFilter, setPeriodFilter] = useState('Período');
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const taskTypesList = ['Ligação', 'E-mail', 'Visita', 'Reunião', 'Tarefa', 'Almoço', 'Whatsapp'];

  const toggleTaskType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const [formData, setFormData] = useState({
    empresa: '',
    negociacao: '',
    valor: '',
    assunto: '',
    descricao: '',
    vendedor: '',
    tipoTarefa: '',
    dataAgendamento: '',
    horario: '',
    concluida: false
  });

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingId(task.id);
      setFormData({
        empresa: task.empresa || '',
        negociacao: task.negociacao || '',
        valor: task.valor || '',
        assunto: task.assunto || '',
        descricao: task.descricao || '',
        vendedor: task.vendedor || '',
        tipoTarefa: task.tipoTarefa || '',
        dataAgendamento: task.dataAgendamento || '',
        horario: task.horario || '',
        concluida: task.concluida
      });
    } else {
      setEditingId(null);
      setFormData({
        empresa: '',
        negociacao: '',
        valor: '',
        assunto: '',
        descricao: '',
        vendedor: '',
        tipoTarefa: '',
        dataAgendamento: '',
        horario: '',
        concluida: false
      });
    }
    setIsModalOpen(true);
  };

  const handlePeriodChange = (e) => {
    const value = e.target.value;
    setPeriodFilter(value);
    if (value === "Período personalizado >") {
      setShowDateModal(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.assunto || !formData.dataAgendamento) return;

    // Campos mapeados para os nomes exatos que a tabela tasks aceita
    // toDbTask() no CRMContext converte tipoTarefa→tipotarefa e dataAgendamento→dataagendamento
    const payload = {
      titulo:          formData.assunto,
      assunto:         formData.assunto,
      descricao:       formData.descricao,
      empresa:         formData.empresa,
      negociacao:      formData.negociacao,
      valor:           Number(formData.valor) || 0,
      vendedor:        formData.vendedor,
      tipoTarefa:      formData.tipoTarefa,
      dataAgendamento: formData.dataAgendamento,
      horario:         formData.horario || '00:00',
      concluida:       formData.concluida,
    };

    if (editingId) {
      updateTask(editingId, payload);
    } else {
      addTask(payload);
    }
    handleCloseModal();
  };

  const toggleTaskStatus = (task) => {
    updateTask(task.id, { concluida: !task.concluida });
  };

  const getTaskStatusInfo = (task) => {
    if (task.concluida) {
      return { text: 'COMPLETA', className: 'status-completa' };
    }
    if (task.dataHora && isPast(parseISO(task.dataHora))) {
      return { text: 'ATRASADA', className: 'status-atrasada' };
    }
    return { text: 'PENDENTE', className: 'status-pendente' };
  };

  const getTaskIcon = (titulo) => {
    const titleLower = titulo.toLowerCase();
    if (titleLower.includes('lig') || titleLower.includes('phone') || titleLower.includes('follow')) return <Phone size={16} className="task-type-icon text-primary" />;
    if (titleLower.includes('whats') || titleLower.includes('msg') || titleLower.includes('mensagem')) return <MessageCircle size={16} className="task-type-icon text-success" />;
    if (titleLower.includes('reuni') || titleLower.includes('meet') || titleLower.includes('call')) return <Video size={16} className="task-type-icon text-warning" />;
    if (titleLower.includes('contato')) return <CheckSquare size={16} className="task-type-icon text-primary" />;
    return <FileText size={16} className="task-type-icon text-muted" />;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Helper para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // Agrupamento para Resumo
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.concluida).length;
  const pendingTasks = totalTasks - completedTasks;

  // Ordenar por data
  const sortedTasks = [...tasks].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

  return (
    <div className="tasks-wrapper">
      {/* HEADER */}
      <div className="tasks-header">
        <h1>Tarefas</h1>
        <div className="tasks-header-actions">
          <button className="btn-icon"><Calendar size={20} /></button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            Criar tarefa
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="tasks-filters-bar">
        <div className="filter-input-group">
          <UserCircle2 size={16} className="filter-icon" />
          <select className="filter-select">
            <option>Todas as tarefas</option>
            <option>Minhas tarefas</option>
          </select>
        </div>
        
        <div className="filter-input-group">
          <Calendar size={16} className="filter-icon" />
          <select className="filter-select" value={periodFilter} onChange={handlePeriodChange}>
            <option>Período</option>
            <option>Hoje</option>
            <option>Esta semana</option>
            <option>Este mês</option>
            <option disabled>──────────</option>
            <option>Últimos 7 dias</option>
            <option>Últimos 14 dias</option>
            <option>Últimos 30 dias</option>
            <option>Últimos 6 meses</option>
            <option disabled>──────────</option>
            <option>Período personalizado {'>'}</option>
          </select>
        </div>
        
        <div className="filter-input-group" style={{position: 'relative', cursor: 'pointer', padding: 0}}>
          <div 
            style={{display: 'flex', alignItems: 'center', width: '100%', padding: '0.25rem 0.5rem'}}
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
          >
            <CheckSquare size={16} className="filter-icon" />
            <span style={{ fontSize: '0.85rem', color: '#334155', userSelect:'none' }}>
              {selectedTypes.length > 0 ? `${selectedTypes.length} selecionado(s)` : 'Todos os tipos de tarefas'}
            </span>
            <ChevronDown size={16} style={{marginLeft: 'auto', color: '#64748B'}} />
          </div>

          {showTypeDropdown && (
            <div className="custom-dropdown-menu">
              {taskTypesList.map(type => (
                <label key={type} className="custom-dropdown-item">
                  <input 
                    type="checkbox" 
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleTaskType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="filter-input-group">
          <Hash size={16} className="filter-icon" />
          <select className="filter-select">
            <option>Todos os status</option>
            <option>Pendentes</option>
            <option>Atrasadas</option>
            <option>Completas</option>
          </select>
        </div>

        <button className="btn-filter-active">
          <Filter size={16} /> Filtros (0)
        </button>
      </div>

      {/* RESUMO */}
      <div className="tasks-summary-box">
        <h4>Resumo das tarefas da semana</h4>
        <div className="tasks-summary-stats">
          <div className="stat-item">
            <span className="stat-value">{totalTasks}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-value text-success">{completedTasks}</span>
            <span className="stat-label">Completas</span>
          </div>
          <div className="stat-item">
            <span className="stat-value text-warning">{pendingTasks}</span>
            <span className="stat-label">Pendentes</span>
          </div>
        </div>
      </div>

      {/* TABELA DE TAREFAS */}
      <div className="tasks-list-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>TAREFAS</th>
              <th>STATUS</th>
              <th>
                <div className="sortable-header">
                  DATA E HORA <ArrowUp size={12} className="sort-icon" />
                </div>
              </th>
              <th>RESPONSÁVEIS</th>
              <th>NEGOCIAÇÃO</th>
              <th>VALOR TOTAL</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.length > 0 ? (
              sortedTasks.map(task => {
                const statusInfo = getTaskStatusInfo(task);
                const relatedDeal = deals.find(d => d.id === task.dealId);
                
                return (
                  <tr key={task.id} className={task.concluida ? 'row-completed' : ''}>
                    <td className="center-col">
                      <input 
                        type="checkbox" 
                        className="custom-checkbox"
                        checked={task.concluida} 
                        onChange={() => toggleTaskStatus(task)}
                      />
                    </td>
                    <td>
                      <div className="task-name-cell" onClick={() => handleOpenModal(task)} style={{cursor: 'pointer'}}>
                        {getTaskIcon(task.titulo)}
                        <span className="task-title">{task.titulo}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${statusInfo.className}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {formatDateTime(task.dataHora)}
                    </td>
                    <td>
                      {task.responsaveis ? (
                        <div className="avatar-badge" title={task.responsaveis}>
                          {task.responsaveis.substring(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="deal-info-cell">
                        <span className="deal-name">{task.negociacao || '—'}</span>
                        <span className="deal-company">{task.empresa}</span>
                      </div>
                    </td>
                    <td className="text-sm font-medium">
                      {task.valor ? formatCurrency(Number(task.valor)) : '-'}
                    </td>
                    <td className="center-col">
                       <button className="btn-icon" title="Detalhes / Editar" onClick={() => handleOpenModal(task)}>
                         <Info size={16} className="text-muted" />
                       </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="empty-state">
                  <div className="empty-content">
                    <CheckSquare size={40} className="empty-icon" />
                    <p>Nenhuma tarefa encontrada.</p>
                    <span className="text-muted">Crie sua primeira tarefa para manter o acompanhamento em dia!</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL NOVA/EDITAR TAREFA */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button type="button" onClick={handleCloseModal} className="close-btn"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="task-form">

              {/* LINHA 1: Empresa + Negociacao */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Empresa *</label>
                  <select
                    value={formData.empresa}
                    onChange={(e) => {
                      setFormData({...formData, empresa: e.target.value, dealId: ''});
                    }}
                    required
                  >
                    <option value="">Selecione a empresa...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.empresa}>{c.empresa}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Negociação</label>
                  <input
                    type="text"
                    value={formData.negociacao}
                    onChange={(e) => setFormData({...formData, negociacao: e.target.value})}
                    placeholder="Ex: Aluguel de guindaste para obra ABC"
                  />
                </div>
              </div>

              {/* VALOR DA NEGOCIAÇÃO */}
              <div className="form-group">
                <label>Valor da Negociação (R$) — opcional</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  placeholder="0,00"
                />
              </div>

              {/* LINHA 2: Assunto da Tarefa */}
              <div className="form-group">
                <label>Assunto da Tarefa *</label>
                <input
                  type="text"
                  value={formData.assunto}
                  onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                  placeholder="Ex: Levantar proposta do guindaste XY para obra ABC"
                  required
                />
              </div>

              {/* LINHA 3: Descricao */}
              <div className="form-group">
                <label>Descrição da Tarefa</label>
                <textarea
                  rows={3}
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Detalhes adicionais sobre a tarefa..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* LINHA 4: Vendedor + Tipo de Tarefa */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Vendedor Responsável</label>
                  <select
                    value={formData.vendedor}
                    onChange={(e) => setFormData({...formData, vendedor: e.target.value})}
                  >
                    <option value="">Selecione o vendedor...</option>
                    {users
                      .filter(u => u.status === 'Ativo')
                      .map(u => (
                        <option key={u.id} value={u.nome}>{u.nome}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Tipo de Tarefa</label>
                  <select
                    value={formData.tipoTarefa}
                    onChange={(e) => setFormData({...formData, tipoTarefa: e.target.value})}
                  >
                    <option value="">Selecione o tipo...</option>
                    {taskTypesList.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LINHA 5: Data de Agendamento + Horário */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Data do Agendamento *</label>
                  <input
                    type="date"
                    value={formData.dataAgendamento}
                    onChange={(e) => setFormData({...formData, dataAgendamento: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Horário</label>
                  <input
                    type="time"
                    value={formData.horario}
                    onChange={(e) => setFormData({...formData, horario: e.target.value})}
                  />
                </div>
              </div>

              {/* LINHA 6: Marcar como Concluida */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    style={{ width: '20px', height: '20px', margin: 0, accentColor: '#10B981' }}
                    checked={formData.concluida}
                    onChange={(e) => setFormData({...formData, concluida: e.target.checked})}
                  />
                  <span style={{ color: formData.concluida ? '#10B981' : 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>
                    {formData.concluida ? '✓ Tarefa Concluída' : 'Marcar como Concluída'}
                  </span>
                </label>
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                {editingId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{color: 'var(--danger-color)', borderColor: 'var(--danger-color)', marginRight: 'auto'}}
                    onClick={() => { deleteTask(editingId); handleCloseModal(); }}
                  >
                    Excluir
                  </button>
                )}
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PERIODO PERSONALIZADO */}
      {showDateModal && (
        <div className="modal-overlay" style={{ zIndex: 1000}}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Período Personalizado</h2>
              <button type="button" onClick={() => { setShowDateModal(false); setPeriodFilter('Período'); }} className="close-btn"><X size={24}/></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Data Inicial</label>
                <input 
                  type="date" 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                  value={dateRange.start} 
                  onChange={e => setDateRange({...dateRange, start: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Data Final</label>
                <input 
                  type="date" 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                  value={dateRange.end} 
                  onChange={e => setDateRange({...dateRange, end: e.target.value})} 
                />
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => { setShowDateModal(false); setPeriodFilter('Período'); }}>Cancelar</button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setShowDateModal(false);
                  if(!dateRange.start && !dateRange.end) setPeriodFilter('Período');
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

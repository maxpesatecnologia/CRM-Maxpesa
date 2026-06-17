import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, Search, Calendar, Filter, Phone, MessageCircle, FileText, CheckSquare, Info, X, Video, Users, UserCircle2, Hash, ArrowUp, Briefcase, ChevronDown, Upload, Trash2 } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ImportTasks from '../components/ImportTasks';
import './Tasks.css';

const Tasks = () => {
  const { tasks, contacts, users, addTask, updateTask, deleteTask, bulkAddTasks, clearAllTasks } = useCRM();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showImport, setShowImport] = useState(false);

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

  const emptyForm = {
    empresa: '',
    negociacao: '',
    assunto: '',
    descricao: '',
    vendedor: '',
    tipoTarefa: '',
    dataCriacao: '',
    horaCriacao: '',
    dataAgendamento: '',
    horario: '',
    status: 'Pendente',
    dataConclusao: '',
    horaConclusao: '',
    concluida: false,
  };

  const [formData, setFormData] = useState(emptyForm);

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingId(task.id);
      setFormData({
        empresa:         task.empresa         || '',
        negociacao:      task.negociacao      || '',
        assunto:         task.assunto         || '',
        descricao:       task.descricao       || '',
        vendedor:        task.vendedor        || '',
        tipoTarefa:      task.tipoTarefa      || '',
        dataCriacao:     task.dataCriacao     || '',
        horaCriacao:     task.horaCriacao     || '',
        dataAgendamento: task.dataAgendamento || '',
        horario:         task.horario         || '',
        status:          task.status          || (task.concluida ? 'Concluída' : 'Pendente'),
        dataConclusao:   task.dataConclusao   || '',
        horaConclusao:   task.horaConclusao   || '',
        concluida:       task.concluida       || false,
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
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
    if (!formData.assunto) return;

    const concluida = formData.status === 'Concluída';

    const payload = {
      titulo:          formData.assunto,
      assunto:         formData.assunto,
      descricao:       formData.descricao,
      empresa:         formData.empresa,
      negociacao:      formData.negociacao,
      vendedor:        formData.vendedor,
      tipoTarefa:      formData.tipoTarefa,
      dataCriacao:     formData.dataCriacao   || null,
      horaCriacao:     formData.horaCriacao   || null,
      dataAgendamento: formData.dataAgendamento || null,
      horario:         formData.horario        || null,
      status:          formData.status,
      dataConclusao:   formData.dataConclusao  || null,
      horaConclusao:   formData.horaConclusao  || null,
      concluida,
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
    if (!titulo) return <FileText size={16} className="task-type-icon text-muted" />;
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
  let completedTasks = 0;
  let overdueTasks = 0;
  let pendingTasks = 0;
  
  tasks.forEach(t => {
    const info = getTaskStatusInfo(t);
    if (info.text === 'COMPLETA') completedTasks++;
    else if (info.text === 'ATRASADA') overdueTasks++;
    else pendingTasks++;
  });
  
  const totalTasks = tasks.length;

  // Ordenar por data
  const sortedTasks = [...tasks].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

  return (
    <div className="tasks-wrapper">
      {/* HEADER */}
      <div className="tasks-header">
        <h1>Tarefas</h1>
        <div className="tasks-header-actions">
          <button className="btn-icon"><Calendar size={20} /></button>
          <button
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #EF4444', color: '#EF4444', background: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}
            onClick={() => {
              if (window.confirm("Tem certeza que deseja excluir TODAS as tarefas? Esta ação não pode ser desfeita.")) {
                clearAllTasks();
              }
            }}
          >
            <Trash2 size={16} /> Limpar
          </button>
          <button
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #00609C', color: '#00609C', background: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}
            onClick={() => setShowImport(true)}
          >
            <Upload size={16} /> Importar
          </button>
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
            <span className="stat-value" style={{ color: '#EF4444' }}>{overdueTasks}</span>
            <span className="stat-label">Atrasadas</span>
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
          <div className="modal-content task-modal">
            <div className="modal-header">
              <h2>{editingId ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button type="button" onClick={handleCloseModal} className="close-btn"><X size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="task-form">

              {/* ── 1. Empresa + Negociação ── */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Empresa ou Contato *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      list="empresas-list-tasks"
                      value={formData.empresa}
                      onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                      placeholder="Buscar empresa ou contato..."
                      required
                      style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', height: '38px' }}
                    />
                    <datalist id="empresas-list-tasks">
                      {contacts.map(c => (
                        <option key={c.id} value={c.empresa}>{c.empresa}</option>
                      ))}
                    </datalist>
                  </div>
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

              {/* ── 2. Assunto ── */}
              <div className="form-group">
                <label>Assunto *</label>
                <input
                  type="text"
                  value={formData.assunto}
                  onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                  placeholder="Ex: Levantar proposta do guindaste XY para obra ABC"
                  required
                />
              </div>

              {/* ── 3. Descrição da Tarefa ── */}
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

              {/* ── 4. Responsável + Tipo de Tarefa ── */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Responsável</label>
                  <select
                    value={formData.vendedor}
                    onChange={(e) => setFormData({...formData, vendedor: e.target.value})}
                  >
                    <option value="">Selecione o responsável...</option>
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

              {/* ── 5. Data de Criação + Hora de Criação ── */}
              <div className="form-section-label">Data de Criação</div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Data de Criação</label>
                  <input
                    type="date"
                    value={formData.dataCriacao}
                    onChange={(e) => setFormData({...formData, dataCriacao: e.target.value})}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Hora de Criação</label>
                  <input
                    type="time"
                    value={formData.horaCriacao}
                    onChange={(e) => setFormData({...formData, horaCriacao: e.target.value})}
                  />
                </div>
              </div>

              {/* ── 6. Data Agendada + Hora Agendada ── */}
              <div className="form-section-label">Data Agendada</div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Data Agendada</label>
                  <input
                    type="date"
                    value={formData.dataAgendamento}
                    onChange={(e) => setFormData({...formData, dataAgendamento: e.target.value})}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Hora Agendada</label>
                  <input
                    type="time"
                    value={formData.horario}
                    onChange={(e) => setFormData({...formData, horario: e.target.value})}
                  />
                </div>
              </div>

              {/* ── 7. Status ── */}
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => {
                    const s = e.target.value;
                    setFormData({...formData, status: s, concluida: s === 'Concluída'});
                  }}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Atrasada">Atrasada</option>
                  <option value="Concluída">Concluída</option>
                </select>
              </div>

              {/* ── 8. Data da Conclusão + Hora da Conclusão ── */}
              <div className="form-section-label">Data da Conclusão</div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Data da Conclusão</label>
                  <input
                    type="date"
                    value={formData.dataConclusao}
                    onChange={(e) => setFormData({...formData, dataConclusao: e.target.value})}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Hora da Conclusão</label>
                  <input
                    type="time"
                    value={formData.horaConclusao}
                    onChange={(e) => setFormData({...formData, horaConclusao: e.target.value})}
                  />
                </div>
              </div>

              {/* ── Rodapé ── */}
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

      {/* MODAL IMPORTAR TAREFAS */}
      {showImport && (
        <ImportTasks
          onClose={() => setShowImport(false)}
          onImport={async (tasksArray) => {
            const result = await bulkAddTasks(tasksArray);
            if (result.success) setShowImport(false);
            return result;
          }}
        />
      )}
    </div>
  );
};

export default Tasks;

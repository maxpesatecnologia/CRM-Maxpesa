import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { X, Search } from 'lucide-react';

const taskTypesList = ['Ligação', 'E-mail', 'Visita', 'Reunião', 'Tarefa', 'Almoço', 'Whatsapp'];

const TaskModal = ({ isOpen, onClose, taskId }) => {
  const { tasks, contacts, users, addTask, updateTask, deleteTask } = useCRM();
  
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

  useEffect(() => {
    if (isOpen) {
      if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
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
        }
      } else {
        setFormData(emptyForm);
      }
    }
  }, [isOpen, taskId, tasks]);

  if (!isOpen) return null;

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

    if (taskId) {
      updateTask(taskId, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (taskId && window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTask(taskId);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content task-modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>{taskId ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button type="button" onClick={onClose} className="close-btn"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">

          {/* 1. Empresa + Negociação */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Empresa ou Contato *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  list="empresas-list-taskmodal"
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  placeholder="Buscar empresa ou contato..."
                  required
                  style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', height: '38px' }}
                />
                <datalist id="empresas-list-taskmodal">
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

          {/* 2. Assunto */}
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

          {/* 3. Descrição */}
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

          {/* 4. Responsável + Tipo */}
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

          {/* 5. Data de Criação */}
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

          {/* 6. Data Agendada */}
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

          {/* 7. Status */}
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

          {/* 8. Data Conclusão */}
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

          {/* Rodapé */}
          <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
            {taskId && (
              <button
                type="button"
                className="btn-secondary"
                style={{color: 'var(--danger-color)', borderColor: 'var(--danger-color)', marginRight: 'auto'}}
                onClick={handleDelete}
              >
                Excluir
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar Tarefa</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;

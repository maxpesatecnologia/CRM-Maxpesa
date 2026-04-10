import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, XSquare, Edit2, Trash2, X, Search } from 'lucide-react';
import './LossReasons.css';

const LossReasons = () => {
  const { lossReasons, addLossReason, updateLossReason, deleteLossReason } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: ''
  });

  const handleOpenModal = (reason = null) => {
    if (reason) {
      setEditingId(reason.id);
      setFormData({ nome: reason.nome });
    } else {
      setEditingId(null);
      setFormData({ nome: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome) return;

    const dataToSave = { ...formData, nome: formData.nome.toUpperCase() };

    if (editingId) {
      updateLossReason(editingId, dataToSave);
    } else {
      addLossReason(dataToSave);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este motivo de perda? Entenda que isso não alterará as negociações que já foram perdidas com esse motivo.')) {
      deleteLossReason(id);
    }
  };

  const filteredReasons = lossReasons.filter(r => 
    r.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sources-wrapper">
      <div className="sources-header">
        <div>
          <h1>Motivos de Perda</h1>
          <p>Gerencie os motivos que os vendedores podem selecionar ao dar 'Lost' em uma negociação.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Novo Motivo
        </button>
      </div>

      <div className="sources-actions">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar motivo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="sources-list-container">
        <div className="sources-table-card">
          <table className="sources-table">
            <thead>
              <tr>
                <th>Nome do Motivo</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredReasons.map(reason => (
                <tr key={reason.id}>
                  <td>
                    <div className="source-name-cell">
                      <div className="source-icon-mini" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                        <XSquare size={14} />
                      </div>
                      <span>{reason.nome.toUpperCase()}</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn edit" onClick={() => handleOpenModal(reason)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(reason.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReasons.length === 0 && (
                <tr>
                  <td colSpan="2" className="empty-table-state">
                    Nenhum motivo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Motivo' : 'Novo Motivo'}</h2>
              <button type="button" onClick={handleCloseModal} className="close-btn"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome do Motivo *</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({nome: e.target.value})}
                  placeholder="Ex: Preço elevado, Ausência de Contato..."
                  required
                  autoFocus
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Motivo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LossReasons;

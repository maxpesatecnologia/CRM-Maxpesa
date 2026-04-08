import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, Share2, Edit2, Trash2, X, Search, Info } from 'lucide-react';
import './LeadSources.css';

const LeadSources = () => {
  const { leadSources, addLeadSource, updateLeadSource, deleteLeadSource } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: ''
  });

  const handleOpenModal = (source = null) => {
    if (source) {
      setEditingId(source.id);
      setFormData({ nome: source.nome });
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

    if (editingId) {
      updateLeadSource(editingId, formData);
    } else {
      addLeadSource(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta fonte de lead?')) {
      deleteLeadSource(id);
    }
  };

  const filteredSources = leadSources.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sources-wrapper">
      <div className="sources-header">
        <div>
          <h1>Fontes de Lead</h1>
          <p>Gerencie as origens e canais por onde seus clientes chegam.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Nova Fonte
        </button>
      </div>

      <div className="sources-actions">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar fonte..." 
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
                <th>Nome da Fonte</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.map(source => (
                <tr key={source.id}>
                  <td>
                    <div className="source-name-cell">
                      <div className="source-icon-mini">
                        <Share2 size={14} />
                      </div>
                      <span>{source.nome}</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn edit" onClick={() => handleOpenModal(source)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(source.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSources.length === 0 && (
                <tr>
                  <td colSpan="2" className="empty-table-state">
                    Nenhuma fonte de lead encontrada.
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
              <h2>{editingId ? 'Editar Fonte' : 'Nova Fonte'}</h2>
              <button type="button" onClick={handleCloseModal} className="close-btn"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome da Fonte *</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({nome: e.target.value})}
                  placeholder="Ex: Indicação, Google, LinkedIn..."
                  required
                  autoFocus
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Fonte</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadSources;

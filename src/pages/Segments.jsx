import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, Tags, Edit2, Trash2, X, Search } from 'lucide-react';
import './Segments.css';

const Segments = () => {
  const { segments, addSegment, updateSegment, deleteSegment } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: ''
  });

  const handleOpenModal = (segment = null) => {
    if (segment) {
      setEditingId(segment.id);
      setFormData({ nome: segment.nome });
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
      updateSegment(editingId, formData);
    } else {
      addSegment(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este segmento?')) {
      deleteSegment(id);
    }
  };

  const filteredSegments = segments.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sources-wrapper">
      <div className="sources-header">
        <div>
          <h1>Segmentos</h1>
          <p>Gerencie os segmentos/nichos de mercado das empresas cadastradas.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Novo Segmento
        </button>
      </div>

      <div className="sources-actions">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar segmento..." 
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
                <th>Nome do Segmento</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSegments.map(segment => (
                <tr key={segment.id}>
                  <td>
                    <div className="source-name-cell">
                      <div className="source-icon-mini">
                        <Tags size={14} />
                      </div>
                      <span>{segment.nome}</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn edit" onClick={() => handleOpenModal(segment)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(segment.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSegments.length === 0 && (
                <tr>
                  <td colSpan="2" className="empty-table-state">
                    Nenhum segmento encontrado.
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
              <h2>{editingId ? 'Editar Segmento' : 'Novo Segmento'}</h2>
              <button type="button" onClick={handleCloseModal} className="close-btn"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome do Segmento *</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({nome: e.target.value})}
                  placeholder="Ex: Tecnologia, Indústria, Saúde..."
                  required
                  autoFocus
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Segmento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Segments;

import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, Megaphone, Edit2, Trash2, X, Info, Search, Filter } from 'lucide-react';
import './Campaigns.css';

const Campaigns = () => {
  const { campaigns, addCampaign, updateCampaign, deleteCampaign } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    status: 'Ativa'
  });

  const handleOpenModal = (campaign = null) => {
    if (campaign) {
      setEditingId(campaign.id);
      setFormData({
        nome: campaign.nome,
        descricao: campaign.descricao || '',
        status: campaign.status || 'Ativa'
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: '',
        descricao: '',
        status: 'Ativa'
      });
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
      updateCampaign(editingId, formData);
    } else {
      addCampaign(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta campanha? Negociações ligadas a ela serão afetadas.')) {
      deleteCampaign(id);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.descricao && c.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="campaigns-wrapper">
      <div className="campaigns-header">
        <div>
          <h1>Campanhas de Marketing</h1>
          <p>Gerencie as origens de seus leads e rastreie o desempenho de cada canal.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Nova Campanha
        </button>
      </div>

      <div className="campaigns-actions">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou descrição..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="campaigns-grid">
        {filteredCampaigns.map(campaign => (
          <div key={campaign.id} className="campaign-card">
            <div className="campaign-card-header">
              <div className="campaign-icon">
                <Megaphone size={24} />
              </div>
              <div className="campaign-status">
                <span className={`status-badge ${campaign.status.toLowerCase()}`}>
                  {campaign.status}
                </span>
              </div>
            </div>
            <div className="campaign-card-body">
              <h3>{campaign.nome}</h3>
              <p>{campaign.descricao || 'Sem descrição informada.'}</p>
            </div>
            <div className="campaign-card-footer">
              <button className="card-action-btn edit" onClick={() => handleOpenModal(campaign)}>
                <Edit2 size={16} /> Editar
              </button>
              <button className="card-action-btn delete" onClick={() => handleDelete(campaign.id)}>
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        ))}
        {filteredCampaigns.length === 0 && (
          <div className="empty-state-full">
            <Megaphone size={48} />
            <p>Nenhuma campanha encontrada.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Campanha' : 'Nova Campanha'}</h2>
              <button type="button" onClick={handleCloseModal} className="close-btn"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="campaign-form">
              <div className="form-group">
                <label>Nome da Campanha *</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Google Ads, Instagram, Indicação..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Ativa">Ativa</option>
                  <option value="Inativa">Inativa</option>
                  <option value="Pausada">Pausada</option>
                </select>
              </div>

              <div className="form-group">
                <label>Descrição (opcional)</label>
                <textarea 
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  rows="3"
                  placeholder="Dê detalhes sobre como essa campanha funciona..."
                ></textarea>
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Campanha</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;

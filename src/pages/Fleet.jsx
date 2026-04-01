import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, Search, Edit2, Trash2, X, Info } from 'lucide-react';
import './Fleet.css';

const Fleet = () => {
  const { fleet, addFleetItem, updateFleetItem, deleteFleetItem } = useCRM();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor: '',
    exibirNaNegociacao: true
  });

  const filteredFleet = fleet.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.descricao && item.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nome: item.nome,
        descricao: item.descricao || '',
        valor: item.valor,
        exibirNaNegociacao: item.exibirNaNegociacao !== undefined ? item.exibirNaNegociacao : true
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: '',
        descricao: '',
        valor: '',
        exibirNaNegociacao: true
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

    const savedData = {
      ...formData,
      valor: Number(formData.valor) || 0
    };

    if (editingId) {
      updateFleetItem(editingId, savedData);
    } else {
      addFleetItem(savedData);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este item permanentemente?')) {
      deleteFleetItem(id);
    }
  };

  // Funcao para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  return (
    <div className="fleet-wrapper">
      <div className="fleet-header">
        <div>
          <h1>Produtos e Serviços (Frota)</h1>
          <p>Gerencie os equipamentos disponíveis para alocação nas negociações</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Adicionar Produto/Serviço
        </button>
      </div>

      <div className="fleet-actions">
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

      <div className="fleet-list-container">
        <table className="fleet-table">
          <thead>
            <tr>
              <th>Nome do Produto/Serviço</th>
              <th>Valor Padrão</th>
              <th>Status</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredFleet.length > 0 ? (
              filteredFleet.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="fleet-name">{item.nome}</div>
                    {item.descricao && <div className="fleet-desc">{item.descricao}</div>}
                  </td>
                  <td className="fleet-price font-medium">{formatCurrency(item.valor)}</td>
                  <td>
                    {item.exibirNaNegociacao ? (
                      <span className="badge badge-active">Ativo nas negociações</span>
                    ) : (
                      <span className="badge badge-inactive">Oculto</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon text-muted" onClick={() => handleOpenModal(item)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon text-danger" onClick={() => handleDelete(item.id)} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
               <tr>
                <td colSpan="4" className="empty-state">
                  Nenhum produto/serviço encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro de Frota/Produto */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Produto ou Serviço' : 'Novo Produto ou Serviço'}</h2>
              <button type="button" onClick={handleCloseModal} className="close-btn"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="fleet-form">
              <div className="form-group">
                <label>Nome do produto ou serviço *</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                />
                <span className="input-hint">
                  Esse item será exibido em todos os funis de venda que podem ver todos os produtos e serviços.
                </span>
              </div>

              <div className="form-group">
                <label>Descrição (opcional)</label>
                <textarea 
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Valor</label>
                <div className="currency-input-wrapper">
                  <span className="currency-symbol">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  />
                </div>
              </div>

              <div className="toggle-group" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Exibir na negociação</label>
                
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={formData.exibirNaNegociacao}
                    onChange={(e) => setFormData({...formData, exibirNaNegociacao: e.target.checked})}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;

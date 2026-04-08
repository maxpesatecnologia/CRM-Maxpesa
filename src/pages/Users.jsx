import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, Search, Edit2, Trash2, X, Shield, User, Loader2, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Users.css';

const Users = () => {
  const { users, addUser, updateUser, deleteUser, bulkTransfer, isLoading } = useCRM();
  const { user: currentUser } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    perfil: 'Usuário',
    status: 'Ativo'
  });

  const filteredUsers = users.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferState, setTransferState] = useState({
    sourceSeller: '',
    targetSeller: '',
    transferDeals: true,
    transferContacts: true,
    transferTasks: true
  });
  const [isTransferring, setIsTransferring] = useState(false);

  const handleBulkTransfer = async (e) => {
    e.preventDefault();
    if (!transferState.sourceSeller || !transferState.targetSeller) {
      alert("Selecione a origem e o destino da transferência.");
      return;
    }
    if (transferState.sourceSeller === transferState.targetSeller) {
      alert("A origem e o destino devem ser vendedores diferentes.");
      return;
    }
    if (!transferState.transferDeals && !transferState.transferContacts && !transferState.transferTasks) {
      alert("Selecione pelo menos um tipo de dado para transferir.");
      return;
    }

    setIsTransferring(true);
    const result = await bulkTransfer(transferState.sourceSeller, transferState.targetSeller, {
      transferDeals: transferState.transferDeals,
      transferContacts: transferState.transferContacts,
      transferTasks: transferState.transferTasks
    });
    setIsTransferring(false);

    if (result.success) {
      alert("Transferência realizada com sucesso!");
      setShowTransferModal(false);
      setTransferState({
        sourceSeller: '',
        targetSeller: '',
        transferDeals: true,
        transferContacts: true,
        transferTasks: true
      });
    } else {
      alert("Erro ao realizar transferência. Tente novamente.");
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nome: item.nome,
        email: item.email || '',
        perfil: item.perfil || 'Usuário',
        status: item.status || 'Ativo'
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: '',
        email: '',
        perfil: 'Usuário',
        status: 'Ativo'
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
    if (!formData.nome || !formData.email) return;

    if (editingId) {
      updateUser(editingId, formData);
    } else {
      addUser(formData);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (id === currentUser?.id) {
      alert('Você não pode excluir seu próprio usuário administrador!');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este usuário permanentemente?')) {
      deleteUser(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="users-wrapper">
      <div className="users-header">
        <div>
          <h1>Equipe / Usuários</h1>
          <p>Gerencie o acesso dos vendedores e consultores ao sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => setShowTransferModal(true)}>
            <ArrowRightLeft size={18} style={{marginRight: '6px'}} /> Transferência em Massa
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Cadastrar Vendedor
          </button>
        </div>
      </div>

      <div className="users-actions">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="users-list-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Contato</th>
              <th>Perfil</th>
              <th>Status</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                 <tr key={user.id}>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar">
                        {user.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="user-name">{user.nome}</span>
                    </div>
                  </td>
                  <td className="text-muted">{user.email}</td>
                  <td>
                    {user.perfil === 'Administrador' ? (
                       <span className="badge badge-admin"><Shield size={12} style={{marginRight: '4px'}}/> Administrador</span>
                    ) : (
                       <span className="badge badge-user"><User size={12} style={{marginRight: '4px'}}/> Usuário</span>
                    )}
                  </td>
                  <td>
                    {user.status === 'Ativo' ? (
                      <span className="badge badge-active">Ativo</span>
                    ) : (
                      <span className="badge badge-inactive">Inativo</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon text-muted" onClick={() => handleOpenModal(user)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className={`btn-icon ${user.id === currentUser?.id ? 'text-disabled' : 'text-danger'}`} 
                        onClick={() => handleDelete(user.id)} 
                        disabled={user.id === currentUser?.id}
                        title={user.id === currentUser?.id ? "Não é possível se excluir" : "Excluir"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
               <tr>
                <td colSpan="5" className="empty-state">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro de Usuario */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Vendedor' : 'Novo Vendedor'}</h2>
              <button type="button" onClick={handleCloseModal} className="close-btn"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="users-form">
              <div className="form-group">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Carlos Silva"
                  required
                />
              </div>

              <div className="form-group">
                <label>E-mail *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="exemplo@empresa.com.br"
                  required
                />
              </div>

              <div className="form-row">
                 <div className="form-group flex-1">
                   <label>Perfil de Acesso</label>
                   <select 
                     value={formData.perfil}
                     onChange={(e) => setFormData({...formData, perfil: e.target.value})}
                   >
                     <option value="Usuário">Usuário Padrão</option>
                     <option value="Administrador">Administrador</option>
                   </select>
                 </div>

                 <div className="form-group flex-1">
                   <label>Status</label>
                   <select 
                     value={formData.status}
                     onChange={(e) => setFormData({...formData, status: e.target.value})}
                   >
                     <option value="Ativo">Acesso Ativo</option>
                     <option value="Inativo">Acesso Bloqueado</option>
                   </select>
                 </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Transferência em Massa */}
      {showTransferModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2>Transferência em Massa</h2>
              <button type="button" onClick={() => setShowTransferModal(false)} className="close-btn"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleBulkTransfer} className="users-form">
              <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                Transfira clientes, negócios e tarefas de um vendedor para o outro. Muito útil em caso de saída de colaboradores ou reestruturação.
              </p>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Vendedor de Origem (De) *</label>
                  <select 
                    value={transferState.sourceSeller}
                    onChange={(e) => setTransferState({...transferState, sourceSeller: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.nome}>{u.nome}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  <ArrowRightLeft size={20} />
                </div>

                <div className="form-group flex-1">
                  <label>Vendedor de Destino (Para) *</label>
                  <select 
                    value={transferState.targetSeller}
                    onChange={(e) => setTransferState({...transferState, targetSeller: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.nome}>{u.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>O que você deseja transferir?</label>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={transferState.transferContacts}
                      onChange={(e) => setTransferState({...transferState, transferContacts: e.target.checked})}
                    /> 
                    Empresas / Contatos
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={transferState.transferDeals}
                      onChange={(e) => setTransferState({...transferState, transferDeals: e.target.checked})}
                    /> 
                    Negociações (Funil)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={transferState.transferTasks}
                      onChange={(e) => setTransferState({...transferState, transferTasks: e.target.checked})}
                    /> 
                    Tarefas Associadas
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTransferModal(false)} disabled={isTransferring}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isTransferring}>
                  {isTransferring ? 'Processando (Aguarde)...' : 'Executar Transferência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

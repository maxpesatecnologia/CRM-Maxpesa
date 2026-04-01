import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, Search, Building2, MapPin, Phone, Mail, X, Briefcase, ListTodo, Calendar, DollarSign, Info } from 'lucide-react';
import './Contacts.css';
import './CompanyDetails.css';

const Contacts = () => {
  const { contacts, addContact, deals, tasks, stages } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para visualização 360
  const [viewingContact, setViewingContact] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('dados'); // 'dados', 'vendas', 'atividades'

  const [form, setForm] = useState({
    empresa: '', documento: '', endereco: '', bairro: '', cidade: '', cep: '', uf: '', telefone: '', contatos: '', email: '', segmento: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.empresa) return;
    addContact(form);
    setIsModalOpen(false);
    setForm({ empresa: '', documento: '', endereco: '', bairro: '', cidade: '', cep: '', uf: '', telefone: '', contatos: '', email: '', segmento: '' });
  };

  const filteredContacts = contacts.filter(c => 
    c.empresa.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.contatos && c.contatos.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.documento && c.documento.includes(searchTerm))
  );

  // Filtros para visão 360
  const contactDeals = viewingContact ? deals.filter(d => d.empresa === viewingContact.empresa) : [];
  const contactTasks = viewingContact ? tasks.filter(t => t.empresa === viewingContact.empresa) : [];

  const getStageTitle = (id) => stages.find(s => s.id === id)?.title || id;
  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  return (
    <div className="contacts-wrapper">
      <div className="contacts-header">
        <div>
          <h1>Empresas</h1>
          <p>Gerencie sua carteira de clientes e empresas cadastradas.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nova Empresa
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por Empresa, Contato ou Documento..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>
      </div>

      <div className="contacts-table-container focus-within:ring-2">
        <table className="contacts-table">
          <thead>
            <tr>
              <th>Nome da Empresa</th>
              <th>CNPJ / CPF</th>
              <th>Endereço</th>
              <th>Telefone</th>
              <th>Pessoa de Contato</th>
              <th>E-mail</th>
              <th>Segmento</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <tr key={contact.id} onClick={() => { setViewingContact(contact); setActiveDetailTab('dados'); }} style={{ cursor: 'pointer' }}>
                <td>
                  <div className="contact-name-cell">
                    <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)', padding: '0.3rem', borderRadius: '4px' }}>
                      <Building2 size={16} />
                    </div>
                    <strong>{contact.empresa}</strong>
                  </div>
                </td>
                <td>{contact.documento || '-'}</td>
                <td>
                  <span className="flex items-center gap-1 text-muted">
                    {(contact.endereco || contact.cidade) ? (
                       <><MapPin size={14} /> {[contact.endereco, contact.bairro, contact.cidade, contact.uf].filter(Boolean).join(', ')}</>
                    ) : '-'}
                  </span>
                </td>
                <td>
                  <span className="flex items-center gap-1 text-muted">
                    {contact.telefone ? <><Phone size={14} /> {contact.telefone}</> : '-'}
                  </span>
                </td>
                <td>{contact.contatos || '-'}</td>
                <td>
                  <span className="flex items-center gap-1 text-muted">
                     {contact.email ? <><Mail size={14}/> {contact.email}</> : '-'}
                  </span>
                </td>
                <td>
                  {contact.segmento && (
                    <span style={{ backgroundColor: '#EDF2F7', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 500 }}>
                      {contact.segmento}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filteredContacts.length === 0 && (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    Nenhum contato encontrado.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALHES 360 */}
      {viewingContact && (
        <div className="details-modal-overlay">
          <div className="details-modal-content">
            <div className="details-modal-header">
              <div className="company-identifier">
                <div className="company-logo-placeholder">
                  <Building2 size={32} />
                </div>
                <div className="company-title-info">
                  <h2>{viewingContact.empresa}</h2>
                  <p>{viewingContact.documento || 'Sem documento'}</p>
                </div>
              </div>
              <button 
                className="close-btn" 
                onClick={() => setViewingContact(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={28} />
              </button>
            </div>

            <div className="details-tabs">
              <button 
                className={`tab-btn ${activeDetailTab === 'dados' ? 'active' : ''}`} 
                onClick={() => setActiveDetailTab('dados')}
              >
                <Info size={16} style={{ marginBottom: '-3px', marginRight: '6px' }} /> Informações
              </button>
              <button 
                className={`tab-btn ${activeDetailTab === 'vendas' ? 'active' : ''}`} 
                onClick={() => setActiveDetailTab('vendas')}
              >
                <Briefcase size={16} style={{ marginBottom: '-3px', marginRight: '6px' }} /> Negociações ({contactDeals.length})
              </button>
              <button 
                className={`tab-btn ${activeDetailTab === 'atividades' ? 'active' : ''}`} 
                onClick={() => setActiveDetailTab('atividades')}
              >
                <ListTodo size={16} style={{ marginBottom: '-3px', marginRight: '6px' }} /> Atividades ({contactTasks.length})
              </button>
            </div>

            <div className="details-body">
              {activeDetailTab === 'dados' && (
                <div className="info-section">
                  <div className="info-item">
                    <label>Pessoa de Contato</label>
                    <span>{viewingContact.contatos || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <label>E-mail</label>
                    <span className="flex items-center gap-2"><Mail size={14}/> {viewingContact.email || '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Telefone</label>
                    <span className="flex items-center gap-2"><Phone size={14}/> {viewingContact.telefone || '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Segmento</label>
                    <span>{viewingContact.segmento || '-'}</span>
                  </div>
                  <div className="info-item" style={{ gridColumn: 'span 2' }}>
                    <label>Endereço Completo</label>
                    <span className="flex items-center gap-2">
                       <MapPin size={14}/> {[viewingContact.endereco, viewingContact.bairro, viewingContact.cidade, viewingContact.uf].filter(Boolean).join(', ') || 'Não informado'}
                    </span>
                  </div>
                </div>
              )}

              {activeDetailTab === 'vendas' && (
                <div className="list-container">
                  {contactDeals.length > 0 ? contactDeals.map(deal => (
                    <div key={deal.id} className="list-item">
                      <div className="item-main-info">
                        <h4>{deal.empresa}</h4>
                        <div className="item-sub-info">
                          <span className="flex items-center gap-1"><Calendar size={12}/> {deal.dataCriacao}</span>
                          <span className="flex items-center gap-1"><Info size={12}/> {deal.produto || 'N/A'}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="amount-badge">{formatCurrency(deal.valorUnico)}</div>
                        <span className={`status-badge ${deal.etapaId === 'etapa-7' ? 'perda' : deal.etapaId === 'etapa-8' ? 'ganho' : 'andamento'}`}>
                          {getStageTitle(deal.etapaId)}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="empty-details">Nenhuma negociação encontrada para esta empresa.</div>
                  )}
                </div>
              )}

              {activeDetailTab === 'atividades' && (
                <div className="list-container">
                  {contactTasks.length > 0 ? contactTasks.map(task => (
                    <div key={task.id} className="list-item">
                      <div className="item-main-info">
                        <h4 style={{ textDecoration: task.concluida ? 'line-through' : 'none', color: task.concluida ? 'var(--text-muted)' : 'var(--text-main)' }}>
                          {task.titulo || task.assunto}
                        </h4>
                        <div className="item-sub-info">
                          <span className="flex items-center gap-1"><Calendar size={12}/> {task.dataAgendamento}</span>
                          {task.tipoTarefa && <span>• {task.tipoTarefa}</span>}
                        </div>
                      </div>
                      <div>
                        {task.concluida ? (
                          <span className="status-badge ganho">Finalizada</span>
                        ) : (
                          <span className="status-badge andamento">Pendente</span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="empty-details">Nenhuma atividade agendada.</div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '1rem 1.5rem', backgroundColor: 'white' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setViewingContact(null)}
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRO */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', zIndex: 1100 }}>
            <div className="modal-header">
              <h2>Nova Empresa</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Nome da Empresa *</label>
                <input required type="text" value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} placeholder="Nome fantasia ou Razão Social" />
              </div>

              <div className="form-group">
                <label>CNPJ ou CPF</label>
                <input type="text" value={form.documento} onChange={e => setForm({...form, documento: e.target.value})} placeholder="00.000.000/0001-00" />
              </div>

              <div className="form-group">
                <label>Segmento</label>
                <select value={form.segmento} onChange={e => setForm({...form, segmento: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Indústria">Indústria</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Varejo">Varejo</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Educação">Educação</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Endereço / Logradouro</label>
                <input type="text" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} placeholder="Ex: Av. Paulista, 1000 - Sala 45" />
              </div>

              <div className="form-group">
                <label>Bairro</label>
                <input type="text" value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} placeholder="Bela Vista" />
              </div>

              <div className="form-group">
                <label>CEP</label>
                <input type="text" value={form.cep} onChange={e => setForm({...form, cep: e.target.value})} placeholder="00000-000" />
              </div>

              <div className="form-group">
                <label>Cidade</label>
                <input type="text" value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} placeholder="São Paulo" />
              </div>

              <div className="form-group">
                <label>UF (Estado)</label>
                <select value={form.uf} onChange={e => setForm({...form, uf: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="SP">SP</option><option value="RJ">RJ</option><option value="MG">MG</option><option value="ES">ES</option>
                  <option value="PR">PR</option><option value="SC">SC</option><option value="RS">RS</option>
                  <option value="MT">MT</option><option value="MS">MS</option><option value="GO">GO</option><option value="DF">DF</option>
                  <option value="BA">BA</option><option value="PE">PE</option><option value="CE">CE</option><option value="RN">RN</option>
                  <option value="PB">PB</option><option value="AL">AL</option><option value="SE">SE</option><option value="MA">MA</option>
                  <option value="PI">PI</option><option value="AM">AM</option><option value="PA">PA</option><option value="AC">AC</option>
                  <option value="RR">RR</option><option value="RO">RO</option><option value="AP">AP</option><option value="TO">TO</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}><hr style={{border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0'}}/></div>

              <div className="form-group">
                <label>Nome do Contato (Pessoa)</label>
                <input type="text" value={form.contatos} onChange={e => setForm({...form, contatos: e.target.value})} placeholder="Ex: Maria Souza (Gerente)" />
              </div>

              <div className="form-group">
                <label>Telefone / WhatsApp</label>
                <input type="text" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="(11) 90000-0000" />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contato@empresa.com.br" />
              </div>

              <div className="modal-footer" style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Empresa</button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;

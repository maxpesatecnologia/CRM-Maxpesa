import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { Search, X, Paperclip, FileText, CheckSquare } from 'lucide-react';
import './DealModal.css';

// Converte o campo produto (string ou JSON) para array de objetos { valor, custom }
const parseProdutos = (produto) => {
  if (!produto) return [{ valor: '', custom: '' }];
  try {
    const arr = JSON.parse(produto);
    if (Array.isArray(arr)) return arr.map(p => ({ valor: p, custom: '' }));
  } catch {}
  return [{ valor: produto, custom: '' }];
};

const emptyForm = {
  empresa: '',
  nomeNegocacao: '',
  dataCriacao: new Date().toISOString().slice(0, 10),
  dataFechamento: '',
  valorUnico: '',
  valorRecorrente: '',
  etapaId: 'etapa-1',
  motivoPerda: '',
  campanha: '',
  fonte: '',
  produtos: [{ valor: '', custom: '' }],
  anexo: null,
  anexoNome: '',
  vendedor: '',
  anotacoes: ''
};

const DealModal = ({ isOpen, onClose, dealId }) => {
  const { stages, deals, addDeal, updateDeal, lossReasons, fleet, contacts, campaigns, leadSources, users, tasks, addTask } = useCRM();
  const [activeTab, setActiveTab] = useState('detalhes');
  const [newDealForm, setNewDealForm] = useState(emptyForm);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('detalhes');
      if (dealId) {
        const deal = deals.find(d => d.id === dealId);
        if (deal) {
          setNewDealForm({
            empresa: deal.empresa || '',
            nomeNegocacao: deal.nomeNegocacao || '',
            dataCriacao: deal.dataCriacao || new Date().toISOString().slice(0, 10),
            dataFechamento: deal.dataFechamento || deal.datafechamento || '',
            valorUnico: deal.valorUnico || '',
            valorRecorrente: deal.valorRecorrente || '',
            etapaId: deal.etapaId || 'etapa-1',
            motivoPerda: deal.motivoPerda || deal.motivoperda || '',
            campanha: deal.campanha || '',
            fonte: deal.fonte || '',
            produtos: parseProdutos(deal.produto),
            anexo: deal.anexo || null,
            anexoNome: deal.anexoNome || '',
            vendedor: deal.vendedor || '',
            anotacoes: deal.anotacoes || ''
          });
        }
      } else {
        setNewDealForm(emptyForm);
      }
    }
  }, [isOpen, dealId, deals]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Arquivo muito grande! Por favor, anexe um arquivo de no máximo 2MB.");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewDealForm({
        ...newDealForm,
        anexo: event.target.result,
        anexoNome: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateDeal = (e) => {
    e?.preventDefault();
    if (!newDealForm.empresa) return;

    const finalProdutos = newDealForm.produtos
      .map(p => p.valor === 'Personalizado' ? p.custom : p.valor)
      .filter(p => p && p.trim() !== '');

    const produto = finalProdutos.length === 0 ? ''
      : finalProdutos.length === 1 ? finalProdutos[0]
      : JSON.stringify(finalProdutos);

    const dealPayload = {
      ...newDealForm,
      produto,
      valorUnico: Number(newDealForm.valorUnico) || 0,
      valorRecorrente: Number(newDealForm.valorRecorrente) || 0
    };
    delete dealPayload.produtos;

    if (dealId) {
      updateDeal(dealId, dealPayload);
    } else {
      addDeal(dealPayload);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ marginBottom: '1rem' }}>
          <h2>{dealId ? 'Editar Negociação' : 'Nova Negociação'}</h2>
          <button type="button" onClick={onClose} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
        </div>
        
        {dealId && (
          <div className="deal-modal-tabs">
            <button type="button" onClick={() => setActiveTab('detalhes')} className={`deal-modal-tab ${activeTab === 'detalhes' ? 'active' : ''}`}>Detalhes</button>
            <button type="button" onClick={() => setActiveTab('anotacoes')} className={`deal-modal-tab ${activeTab === 'anotacoes' ? 'active' : ''}`}>Anotações</button>
            <button type="button" onClick={() => setActiveTab('tarefas')} className={`deal-modal-tab ${activeTab === 'tarefas' ? 'active' : ''}`}>Tarefas</button>
          </div>
        )}

        {activeTab === 'detalhes' && (
        <form onSubmit={handleCreateDeal}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 1. Empresa */}
            <div className="form-group">
              <label>Empresa ou Contato *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  list="empresas-list-modal"
                  value={newDealForm.empresa}
                  onChange={(e) => setNewDealForm({...newDealForm, empresa: e.target.value})}
                  placeholder="Buscar empresa ou contato..."
                  required
                  style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', height: '38px' }}
                />
                <datalist id="empresas-list-modal">
                  {contacts.map(c => <option key={c.id} value={c.empresa}>{c.empresa}</option>)}
                </datalist>
              </div>
            </div>

            {/* 2. Nome da Negociação */}
            <div className="form-group">
              <label>Nome da Negociação</label>
              <input 
                type="text" 
                value={newDealForm.nomeNegocacao} 
                onChange={e => setNewDealForm({...newDealForm, nomeNegocacao: e.target.value})} 
                placeholder="Ex: Aluguel de Guindaste - Obra X"
              />
            </div>

            {/* 2.1 Vendedor Responsável */}
            <div className="form-group">
              <label>Vendedor Responsável</label>
              <select 
                value={newDealForm.vendedor} 
                onChange={e => setNewDealForm({...newDealForm, vendedor: e.target.value})}
              >
                <option value="">Selecione um vendedor...</option>
                {users.filter(u => u.status === 'Ativo').map(u => (
                  <option key={u.id} value={u.nome}>{u.nome}</option>
                ))}
              </select>
            </div>

            {/* 2.5. Equipamentos (múltiplos) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ margin: 0 }}>Equipamentos</label>
                <button
                  type="button"
                  onClick={() => setNewDealForm(f => ({ ...f, produtos: [...f.produtos, { valor: '', custom: '' }] }))}
                  style={{ fontSize: '0.78rem', color: 'var(--primary-color)', background: 'none', border: '1px solid var(--primary-color)', borderRadius: '4px', padding: '2px 10px', cursor: 'pointer', fontWeight: 600 }}
                >
                  + Adicionar
                </button>
              </div>

              {newDealForm.produtos.map((prod, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={prod.valor}
                      onChange={e => {
                        const updated = newDealForm.produtos.map((p, i) =>
                          i === idx ? { valor: e.target.value, custom: '' } : p
                        );
                        setNewDealForm({ ...newDealForm, produtos: updated });
                      }}
                      style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    >
                      <option value="">Selecione o equipamento...</option>
                      {fleet.map(item => (
                        <option key={item.id} value={item.nome}>{item.nome}</option>
                      ))}
                      <option value="Personalizado">Outro (especificar)</option>
                    </select>
                    {newDealForm.produtos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewDealForm({ ...newDealForm, produtos: newDealForm.produtos.filter((_, i) => i !== idx) })}
                        style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {prod.valor === 'Personalizado' && (
                    <input
                      type="text"
                      value={prod.custom}
                      onChange={e => {
                        const updated = newDealForm.produtos.map((p, i) =>
                          i === idx ? { ...p, custom: e.target.value } : p
                        );
                        setNewDealForm({ ...newDealForm, produtos: updated });
                      }}
                      placeholder="Nome do equipamento customizado"
                      style={{ width: '100%', marginTop: '0.4rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* 3. Datas lado a lado */}
            <div className="deal-modal-grid-2">
              <div className="form-group">
                <label>Data de Criação</label>
                <input 
                  type="date" 
                  value={newDealForm.dataCriacao} 
                  onChange={e => setNewDealForm({...newDealForm, dataCriacao: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Data de Fechamento</label>
                <input 
                  type="date" 
                  value={newDealForm.dataFechamento || ''} 
                  onChange={e => setNewDealForm({...newDealForm, dataFechamento: e.target.value})} 
                />
              </div>
            </div>

            {/* 4. Valores */}
            <div className="deal-modal-grid-2">
              <div className="form-group">
                <label>Valor Único (R$)</label>
                <input 
                  type="number" 
                  value={newDealForm.valorUnico} 
                  onChange={e => setNewDealForm({...newDealForm, valorUnico: e.target.value})} 
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Valor Recorrente (R$)</label>
                <input 
                  type="number" 
                  value={newDealForm.valorRecorrente} 
                  onChange={e => setNewDealForm({...newDealForm, valorRecorrente: e.target.value})} 
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* 5. Etapa do Funil */}
            <div className="form-group">
              <label>Etapa do Funil</label>
              <select value={newDealForm.etapaId} onChange={e => setNewDealForm({...newDealForm, etapaId: e.target.value, motivoPerda: ''})}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            {/* 5.1 Motivo da Perda */}
            {newDealForm.etapaId === 'etapa-7' && (
              <div className="form-group" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                <label style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '1rem' }}>⚠️</span> Motivo da Perda <span style={{ fontWeight: 400, color: '#EF4444' }}>(obrigatório para esta etapa)</span>
                </label>
                <select
                  value={newDealForm.motivoPerda}
                  onChange={e => setNewDealForm({...newDealForm, motivoPerda: e.target.value})}
                  required
                  style={{ borderColor: '#FECACA' }}
                >
                  <option value="">Selecione o motivo...</option>
                  {lossReasons.map(r => (
                    <option key={r.id} value={r.nome}>{r.nome.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 6. Campanha */}
            <div className="form-group">
              <label>Campanha</label>
              <select 
                value={newDealForm.campanha} 
                onChange={e => setNewDealForm({...newDealForm, campanha: e.target.value})}
              >
                <option value="">Selecione uma campanha...</option>
                {campaigns.filter(c => c.status === 'Ativa').map(c => (
                  <option key={c.id} value={c.nome}>{c.nome}</option>
                ))}
                <option value="Outros">Outras</option>
              </select>
            </div>

            {/* 7. Fonte do Lead */}
            <div className="form-group">
              <label>Fonte do Lead</label>
              <select 
                value={newDealForm.fonte} 
                onChange={e => setNewDealForm({...newDealForm, fonte: e.target.value})}
              >
                <option value="">Selecione a fonte...</option>
                {leadSources.map(s => (
                  <option key={s.id} value={s.nome}>{s.nome}</option>
                ))}
              </select>
            </div>

            {/* 8. Anexo de Proposta Física */}
            <div className="form-group" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Paperclip size={18} className="text-muted" /> Anexar Proposta Física (PDF/JPG)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  style={{ fontSize: '0.8rem' }}
                />
                {newDealForm.anexoNome && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <FileText size={14} /> Arquivo pronto: <strong>{newDealForm.anexoNome}</strong>
                     <button 
                        type="button" 
                        onClick={() => setNewDealForm({...newDealForm, anexo: null, anexoNome: ''})}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.7rem' }}
                     >
                       Remover
                     </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">
              {dealId ? 'Salvar Alterações' : 'Criar Negociação'}
            </button>
          </div>
        </form>
        )}

        {activeTab === 'anotacoes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '300px' }}>
            <div className="form-group">
              <label>Bloco de Notas da Negociação</label>
              <textarea 
                value={newDealForm.anotacoes || ''} 
                onChange={e => {
                  setNewDealForm({...newDealForm, anotacoes: e.target.value});
                }}
                placeholder="Escreva suas anotações aqui..."
                rows={12}
                style={{ resize: 'vertical', width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                * Lembre-se de clicar em "Salvar Alterações" para gravar suas anotações.
              </p>
            </div>
            <div className="modal-footer" style={{ marginTop: 'auto' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Fechar</button>
              <button type="button" className="btn-primary" onClick={handleCreateDeal}>
                Salvar Alterações
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tarefas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>Tarefas desta Negociação</h3>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: '#475569', marginTop: 0 }}>Nova Tarefa Rápida</h4>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                addTask({
                  titulo: fd.get('assunto'),
                  assunto: fd.get('assunto'),
                  empresa: newDealForm.empresa,
                  negociacao: newDealForm.nomeNegocacao,
                  tipoTarefa: 'Tarefa',
                  status: 'Pendente',
                  concluida: false
                });
                e.target.reset();
              }} className="deal-quick-task-form">
                <input name="assunto" type="text" placeholder="Assunto da tarefa..." required style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Adicionar</button>
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tasks.filter(t => t.negociacao === newDealForm.nomeNegocacao && t.empresa === newDealForm.empresa).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0', margin: 0 }}>Nenhuma tarefa vinculada a esta negociação.</p>
              ) : (
                tasks.filter(t => t.negociacao === newDealForm.nomeNegocacao && t.empresa === newDealForm.empresa).map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckSquare size={16} color={t.concluida ? 'var(--success-color)' : 'var(--text-muted)'} />
                      <span style={{ fontSize: '0.85rem', textDecoration: t.concluida ? 'line-through' : 'none', color: t.concluida ? 'var(--text-muted)' : 'var(--text-main)' }}>{t.assunto}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>{t.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealModal;

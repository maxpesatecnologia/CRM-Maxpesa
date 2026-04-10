import React, { useState } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core';
import { useCRM } from '../context/CRMContext';
import { Plus, Building2, Calendar, DollarSign, X, Edit2, Trash2, Paperclip, FileText, Sparkles, UserCheck, HardHat, Search, Handshake, XCircle, Trophy } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import './Pipeline.css';

// --- Card Component (Draggable) ---
const DealCard = ({ deal, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: deal
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1
  } : undefined;

  // Semântica de cores
  const isWon = deal.etapaId === 'etapa-8';
  const isLost = deal.etapaId === 'etapa-7';
  let borderColor = 'var(--primary-color)';
  if (isWon) borderColor = 'var(--success-color)';
  if (isLost) borderColor = 'var(--danger-color)';

  return (
    <div 
      ref={setNodeRef} style={{...style, borderLeftColor: borderColor}} 
      {...listeners} {...attributes} 
      className="deal-card"
    >
      <div className="flex justify-between items-center text-xs">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="text-muted flex items-center gap-1">
            <Calendar size={12}/> Criado: {deal.dataCriacao}
          </span>
          {(deal.dataFechamento || deal.datafechamento) && (
            <span className="flex items-center gap-1" style={{ color: isWon ? 'var(--success-color)' : isLost ? 'var(--danger-color)' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>
              <Calendar size={11}/> Fechado: {deal.dataFechamento || deal.datafechamento}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {deal.fonte && <span className="text-muted" style={{backgroundColor: 'var(--bg-color)', padding: '2px 4px', borderRadius: '4px'}}>{deal.fonte}</span>}
          <button 
            type="button" 
            onPointerDown={(e) => { e.stopPropagation(); onEdit(deal); }}
            style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <Edit2 size={12} />
          </button>
          <button 
            type="button" 
            onPointerDown={(e) => { e.stopPropagation(); onDelete(deal.id); }}
            style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-1" style={{ marginTop: '0.25rem' }}>
        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
          {deal.nomeNegocacao || 'Sem Título'}
        </strong>
        <div className="flex items-center gap-1 text-xs text-muted">
          <Building2 size={12} /> {deal.empresa}
        </div>
      </div>

      {deal.produto && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', paddingLeft: '1.5rem'}}>
          Equipamento: {deal.produto}
        </div>
      )}
      
      <div className="flex flex-col gap-1" style={{ marginTop: '0.5rem' }}>
        <div className="flex items-center gap-1 text-sm font-medium" style={{ color: isWon ? 'var(--success-color)' : isLost ? 'var(--danger-color)' : 'var(--text-main)' }}>
          <DollarSign size={14} />
          <span title="Valor Único">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.valorUnico || 0)}</span>
          <span className="text-xs text-muted" style={{ fontWeight: 400 }}>(Único)</span>
        </div>
        {(Number(deal.valorRecorrente) > 0) && (
          <div className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--primary-color)' }}>
            <DollarSign size={14} />
            <span title="Valor Recorrente">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.valorRecorrente)}</span>
            <span className="text-xs text-muted" style={{ fontWeight: 400 }}>(Recorrente)</span>
          </div>
        )}
      </div>

      {isLost && deal.motivoPerda && (
        <div style={{ fontSize: '0.7rem', color: 'var(--danger-color)', marginTop: '0.25rem', backgroundColor: '#fef2f2', padding: '2px 4px', borderRadius: '4px' }}>
          Motivo: {deal.motivoPerda.toUpperCase()}
        </div>
      )}

      {deal.anexo && (
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success-color)', fontSize: '0.7rem', fontWeight: 600 }}>
          <Paperclip size={10} /> Proposta Anexada
        </div>
      )}
    </div>
  );
};
// Mapeamento de ícones para cada etapa
const StageIcon = ({ id, size = 16 }) => {
  switch (id) {
    case 'etapa-1': return <Sparkles size={size} />;
    case 'etapa-2': return <UserCheck size={size} />;
    case 'etapa-3': return <HardHat size={size} />;
    case 'etapa-4': return <FileText size={size} />;
    case 'etapa-5': return <Search size={size} />;
    case 'etapa-6': return <Handshake size={size} />;
    case 'etapa-7': return <XCircle size={size} />;
    case 'etapa-8': return <Trophy size={size} />;
    default: return null;
  }
};

// --- Column Component (Droppable) ---
const Column = ({ title, id, deals, onEdit, onDelete }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id
  });

  // Calculate sum for column - Robust version checking both possible field names
  const totalUnico = deals.reduce((acc, curr) => {
    const val = curr.valorUnico ?? curr.valorunico ?? 0;
    return acc + (Number(val) || 0);
  }, 0);

  const totalRecorrente = deals.reduce((acc, curr) => {
    const val = curr.valorRecorrente ?? curr.valorrecorrente ?? 0;
    return acc + (Number(val) || 0);
  }, 0);

  return (
    <div ref={setNodeRef} className="kanban-column" style={{ backgroundColor: isOver ? '#E2E8F0' : 'var(--column-bg)' }}>
      <div className="column-header">
        <div className="flex gap-2 items-center">
          <div className={`column-icon-wrapper stage-${id}`}>
            <StageIcon id={id} size={14} />
          </div>
          <div className="flex flex-col">
            <h3>{title}</h3>
            <span className="text-xs text-muted" style={{textTransform: 'none', fontWeight: 500}}>
              Único: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalUnico)}
              {totalRecorrente > 0 && (
                <> | Rec: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalRecorrente)}</>
              )}
            </span>
          </div>
        </div>
        <span className="column-badge">{deals.length}</span>
      </div>
      <div className="column-content">
        {deals.map(deal => (
          <DealCard key={deal.id} deal={deal} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {deals.length === 0 && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            Nenhum negócio
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Pipeline Component ---
const Pipeline = () => {
  const { stages, deals, moveDeal, addDeal, updateDeal, deleteDeal, lossReasons, fleet, contacts, campaigns, leadSources, users } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
  
  // Edição
  const [editingDealId, setEditingDealId] = useState(null);
  

  // New Deal State
  const [newDealForm, setNewDealForm] = useState({
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
    produto: '',
    anexo: null,      // Base64 do arquivo
    anexoNome: '',    // Nome original do arquivo
    vendedor: ''
  });

  // Loss Reason State
  const [selectedLossReason, setSelectedLossReason] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id;
    const currentDeal = deals.find(d => d.id === dealId);
    const targetStageId = over.id;

    if (currentDeal.etapaId === targetStageId) return;

    // Check if moving to "Perdemos"
    if (targetStageId === 'etapa-7') {
      setPendingMove({ dealId, targetStageId });
      setLossModalOpen(true);
      return;
    }

    // Normal move
    moveDeal(dealId, targetStageId);
  };

  const handleOpenNewDeal = () => {
    setEditingDealId(null);
    setNewDealForm({ 
      empresa: '', 
      nomeNegocacao: '',
      dataCriacao: new Date().toISOString().slice(0, 10),
      dataFechamento: '',
      valorUnico: '',
      valorRecorrente: '',
      etapaId: 'etapa-1',
      campanha: '',
      fonte: '', 
      produto: '',
      anexo: null,
      anexoNome: '',
      vendedor: ''
    });
    setIsModalOpen(true);
  };

  const handleEditDeal = (deal) => {
    setEditingDealId(deal.id);
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
      produto: deal.produto || '',
      anexo: deal.anexo || null,
      anexoNome: deal.anexoNome || '',
      vendedor: deal.vendedor || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteDeal = (id) => {
    if (window.confirm("Tem certeza que deseja processar a exclusão desta negociação permanentemente?")) {
      deleteDeal(id);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Arquivo muito grande! Por favor, anexe um arquivo de no máximo 2MB para garantir a performance.");
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
    e.preventDefault();
    if (!newDealForm.empresa) return;
    
    const finalProduct = newDealForm.produto === 'Personalizado' ? newDealForm.produtoManual : newDealForm.produto;
    
    // Preparar payload removendo campos que não existem no banco
    const dealPayload = {
      ...newDealForm,
      produto: finalProduct,
      valorUnico: Number(newDealForm.valorUnico) || 0,
      valorRecorrente: Number(newDealForm.valorRecorrente) || 0
    };
    delete dealPayload.produtoManual;
    
    if (editingDealId) {
      updateDeal(editingDealId, dealPayload);
    } else {
      addDeal(dealPayload);
    }
    
    setIsModalOpen(false);
    setNewDealForm({ 
      empresa: '', 
      nomeNegocacao: '',
      dataCriacao: new Date().toISOString().slice(0, 10),
      dataFechamento: '',
      valorUnico: '', 
      etapaId: 'etapa-1',
      motivoPerda: '',
      campanha: '',
      fonte: '', 
      produto: '',
      anexo: null,
      anexoNome: '',
      vendedor: ''
    });
    setEditingDealId(null);
  };

  const confirmLossAndMove = () => {
    if (!selectedLossReason) return alert("Selecione um motivo de perda!");
    
    moveDeal(pendingMove.dealId, pendingMove.targetStageId, selectedLossReason);
    setLossModalOpen(false);
    setPendingMove(null);
    setSelectedLossReason('');
  };

  return (
    <div className="pipeline-wrapper">
      <div className="pipeline-header">
        <div>
          <h1>Funil de Vendas</h1>
          <p>Mova as negociações entre as etapas do funil</p>
        </div>
        <button className="btn-primary" onClick={handleOpenNewDeal}>
          <Plus size={18} /> Adicionar Negócio
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className="kanban-board-container">
          {stages.map(stage => (
            <Column 
              key={stage.id} 
              id={stage.id} 
              title={stage.title} 
              deals={deals.filter(d => d.etapaId === stage.id)}
              onEdit={handleEditDeal}
              onDelete={handleDeleteDeal}
            />
          ))}
        </div>
      </DndContext>

      {/* New Deal Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ marginBottom: '1rem' }}>
              <h2>{editingDealId ? 'Editar Negociação' : 'Nova Negociação'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
            </div>
            

            <form onSubmit={handleCreateDeal}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 1. Empresa */}
                <div className="form-group">
                  <label>Empresa *</label>
                  <select 
                    value={newDealForm.empresa} 
                    onChange={e => setNewDealForm({...newDealForm, empresa: e.target.value})}
                    required
                  >
                    <option value="">Selecione uma empresa...</option>
                    {contacts.map(c => <option key={c.id} value={c.empresa}>{c.empresa}</option>)}
                  </select>
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

                {/* 2.5. Equipamento (Produto) */}
                <div className="form-group">
                  <label>Equipamento (Produto)</label>
                  <select 
                    value={newDealForm.produto} 
                    onChange={e => setNewDealForm({...newDealForm, produto: e.target.value})}
                  >
                    <option value="">Selecione o equipamento...</option>
                    {fleet.map(item => (
                      <option key={item.id} value={item.nome}>{item.nome}</option>
                    ))}
                    <option value="Personalizado">Outro (especificar)</option>
                  </select>
                </div>

                {newDealForm.produto === 'Personalizado' && (
                  <div className="form-group">
                    <label>Especifique o Equipamento</label>
                    <input 
                      type="text" 
                      value={newDealForm.produtoManual || ''} 
                      onChange={e => setNewDealForm({...newDealForm, produtoManual: e.target.value})} 
                      placeholder="Nome do equipamento customizado"
                    />
                  </div>
                )}

                {/* 3. Datas lado a lado */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

                {/* 5.1 Motivo da Perda — aparece só quando etapa = Perdemos */}
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
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
                      Máximo 2MB. O arquivo será salvo localmente no seu navegador.
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingDealId ? 'Salvar Alterações' : 'Criar Negociação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loss Reason Modal */}
      {lossModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{color: 'var(--danger-color)'}}>Motivo da Perda</h2>
              <button type="button" onClick={() => {setLossModalOpen(false); setPendingMove(null);}} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
            </div>
            <p style={{marginBottom: '1rem', color: 'var(--text-muted)'}}>
              Por favor, informe o motivo pelo qual esta negociação foi perdida. Esta informação é vital para os relatórios.
            </p>
            <div className="form-group">
              <label>Selecione um motivo</label>
              <select 
                value={selectedLossReason} 
                onChange={e => setSelectedLossReason(e.target.value)}
              >
                <option value="">-- Escolha --</option>
                {lossReasons.map(reason => (
                  <option key={reason.id} value={reason.nome}>{reason.nome.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => {setLossModalOpen(false); setPendingMove(null);}}>Cancelar</button>
              <button 
                type="button"
                className="btn-primary" 
                style={{backgroundColor: 'var(--danger-color)'}} 
                onClick={confirmLossAndMove}
                disabled={!selectedLossReason}
              >
                Confirmar Perda
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Pipeline;

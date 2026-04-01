import React, { useState } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core';
import { useCRM } from '../context/CRMContext';
import { Plus, Building2, Calendar, DollarSign, X, Edit2, Trash2 } from 'lucide-react';
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
        <span className="text-muted flex items-center gap-1">
          <Calendar size={12}/> {deal.dataCriacao}
        </span>
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
      
      <div className="flex items-center gap-2" style={{ marginTop: '0.25rem' }}>
        <Building2 size={16} color="var(--text-main)" />
        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
          {deal.empresa}
        </strong>
      </div>

      {deal.produto && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', paddingLeft: '1.5rem'}}>
          Prod: {deal.produto}
        </div>
      )}
      
      <div className="flex items-center gap-1 text-sm font-medium" style={{ marginTop: '0.5rem', color: isWon ? 'var(--success-color)' : isLost ? 'var(--danger-color)' : 'var(--text-main)' }}>
        <DollarSign size={14} />
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.valorUnico)}
      </div>

      {isLost && deal.motivoPerda && (
        <div style={{ fontSize: '0.7rem', color: 'var(--danger-color)', marginTop: '0.25rem', backgroundColor: '#fef2f2', padding: '2px 4px', borderRadius: '4px' }}>
          Motivo: {deal.motivoPerda}
        </div>
      )}
    </div>
  );
};

// --- Column Component (Droppable) ---
const Column = ({ title, id, deals, onEdit, onDelete }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id
  });

  // Calculate sum for column
  const totalValue = deals.reduce((acc, curr) => acc + Number(curr.valorUnico), 0);

  return (
    <div ref={setNodeRef} className="kanban-column" style={{ backgroundColor: isOver ? '#E2E8F0' : 'var(--column-bg)' }}>
      <div className="column-header">
        <div className="flex flex-col gap-1">
          <h3>{title}</h3>
          <span className="text-xs text-muted" style={{textTransform: 'none', fontWeight: 500}}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValue)}
          </span>
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
  const { stages, deals, moveDeal, addDeal, updateDeal, deleteDeal, lossReasons, fleet } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
  
  // Edição
  const [editingDealId, setEditingDealId] = useState(null);
  
  // Abas do Modal
  const [activeTab, setActiveTab] = useState('detalhes'); // 'detalhes' ou 'produto'

  // New Deal State
  const [newDealForm, setNewDealForm] = useState({
    empresa: '', valorUnico: '', fonte: '', etapaId: 'etapa-1', produto: ''
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
    setNewDealForm({ empresa: '', valorUnico: '', fonte: '', etapaId: 'etapa-1', produto: '' });
    setActiveTab('detalhes');
    setIsModalOpen(true);
  };

  const handleEditDeal = (deal) => {
    setEditingDealId(deal.id);
    setNewDealForm({
      empresa: deal.empresa || '',
      valorUnico: deal.valorUnico || '',
      fonte: deal.fonte || '',
      etapaId: deal.etapaId || 'etapa-1',
      produto: deal.produto || ''
    });
    setActiveTab('detalhes');
    setIsModalOpen(true);
  };

  const handleDeleteDeal = (id) => {
    if (window.confirm("Tem certeza que deseja processar a exclusão desta negociação permanentemente?")) {
      deleteDeal(id);
    }
  };

  const handleCreateDeal = (e) => {
    e.preventDefault();
    if (!newDealForm.empresa) return;
    
    const finalProduct = newDealForm.produto === 'Personalizado' ? newDealForm.produtoManual : newDealForm.produto;
    
    if (editingDealId) {
      updateDeal(editingDealId, {
        ...newDealForm,
        produto: finalProduct,
        valorUnico: Number(newDealForm.valorUnico) || 0
      });
    } else {
      addDeal({
        ...newDealForm,
        produto: finalProduct,
        valorUnico: Number(newDealForm.valorUnico) || 0
      });
    }
    
    setIsModalOpen(false);
    setNewDealForm({ empresa: '', valorUnico: '', fonte: '', etapaId: 'etapa-1', produto: '' });
    setActiveTab('detalhes');
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
            
            {/* Tabs de Navegação UI Premium */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <button 
                type="button"
                onClick={() => setActiveTab('detalhes')}
                style={{
                  background: 'none', border: 'none', padding: '0.5rem 0', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  color: activeTab === 'detalhes' ? 'var(--primary-color)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'detalhes' ? '2px solid var(--primary-color)' : '2px solid transparent'
                }}
              >
                Detalhes da Negociação
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('produto')}
                style={{
                  background: 'none', border: 'none', padding: '0.5rem 0', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  color: activeTab === 'produto' ? 'var(--primary-color)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'produto' ? '2px solid var(--primary-color)' : '2px solid transparent'
                }}
              >
                Produto & Valores
              </button>
            </div>

            <form onSubmit={handleCreateDeal}>
              
              {/* Tab 1: Detalhes */}
              {activeTab === 'detalhes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Nome da Empresa *</label>
                    <input 
                      type="text" 
                      value={newDealForm.empresa} 
                      onChange={e => setNewDealForm({...newDealForm, empresa: e.target.value})} 
                      placeholder="Ex: Monto Industrial LTDA"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fonte do Contato</label>
                    <select value={newDealForm.fonte} onChange={e => setNewDealForm({...newDealForm, fonte: e.target.value})}>
                      <option value="">Selecione...</option>
                      <option value="Contato por Email">Contato por Email</option>
                      <option value="Contato por Telefone">Contato por Telefone</option>
                      <option value="Contato pelo Site">Contato pelo Site</option>
                      <option value="Google e Outros Buscadores">Google e Outros Buscadores</option>
                      <option value="Prospeccao Ativa">Prospeccao Ativa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Etapa Inicial no Funil</label>
                    <select value={newDealForm.etapaId} onChange={e => setNewDealForm({...newDealForm, etapaId: e.target.value})}>
                      {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Tab 2: Produto */}
              {activeTab === 'produto' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Produto / Serviço (Frota)</label>
                    <select 
                      value={newDealForm.produto} 
                      onChange={e => {
                        const selectedName = e.target.value;
                        const fleetItem = fleet.find(item => item.nome === selectedName);
                        setNewDealForm({
                          ...newDealForm, 
                          produto: selectedName,
                          valorUnico: fleetItem ? fleetItem.valor : newDealForm.valorUnico
                        });
                      }}
                    >
                      <option value="">Selecione um item da frota...</option>
                      {fleet.filter(item => item.exibirNaNegociacao).map(item => (
                        <option key={item.id} value={item.nome}>{item.nome} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}</option>
                      ))}
                      <option value="Personalizado">-- Outro (Manual) --</option>
                    </select>
                  </div>

                  {newDealForm.produto === 'Personalizado' && (
                    <div className="form-group">
                      <label>Nome do Produto Customizado</label>
                      <input 
                        type="text" 
                        placeholder="Digite o nome do produto..."
                        onChange={e => setNewDealForm({...newDealForm, produtoManual: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Valor Único Negociado (R$)</label>
                    <input 
                      type="number" 
                      value={newDealForm.valorUnico} 
                      onChange={e => setNewDealForm({...newDealForm, valorUnico: e.target.value})} 
                      placeholder="0.00"
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Ao selecionar um item da frota, o valor padrão é sugerido automaticamente.
                  </p>
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                {activeTab === 'detalhes' ? (
                  <button type="button" className="btn-primary" onClick={() => setActiveTab('produto')}>Próximo Passo</button>
                ) : (
                  <button type="submit" className="btn-primary">{editingDealId ? 'Salvar Alterações' : 'Concluir Cadastro'}</button>
                )}
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
                  <option key={reason} value={reason}>{reason}</option>
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

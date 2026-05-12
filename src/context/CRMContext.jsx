import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

// Normaliza as colunas que o Supabase retorna em minúsculo de volta para camelCase
const normalizeDeal = (d) => {
  const n = {
    ...d,
    nomeNegocacao:  d.nomeNegocacao  ?? d.nomenegocacao  ?? '',
    etapaId:        d.etapaId        ?? d.etapaid        ?? 'etapa-1',
    valorUnico:      Number(d.valorUnico      ?? d.valorunico      ?? 0),
    valorRecorrente: Number(d.valorRecorrente ?? d.valorrecorrente ?? 0),
    motivoPerda:    d.motivoPerda    ?? d.motivoperda    ?? null,
    dataCriacao:    d.dataCriacao    ?? d.datacriacao    ?? null,
    dataFechamento: d.dataFechamento ?? d.datafechamento ?? null,
    anexo:          d.anexo          ?? d.anexo          ?? null,
    anexoNome:      d.anexoNome      ?? d.anexonome      ?? null,
  };
  
  // Limpa campos duplicados (mantém apenas camelCase na UI)
  if ('nomenegocacao' in n) delete n.nomenegocacao;
  if ('etapaid' in n) delete n.etapaid;
  if ('valorunico' in n) delete n.valorunico;
  if ('valorrecorrente' in n) delete n.valorrecorrente;
  if ('motivoperda' in n) delete n.motivoperda;
  if ('datacriacao' in n) delete n.datacriacao;
  if ('datafechamento' in n) delete n.datafechamento;
  if ('anexonome' in n) delete n.anexonome;
  
  return n;
};

// Converte campos camelCase para os nomes reais das colunas no banco
const toDbDeal = (d) => {
  const out = { ...d };
  
  // Mapeamentos necessários (colunas que são lowercase no Postgres)
  if ('nomeNegocacao' in out) { out.nomenegocacao = out.nomeNegocacao; delete out.nomeNegocacao; }
  if ('etapaId' in out) { out.etapaid = out.etapaId; delete out.etapaId; }
  if ('valorUnico' in out) { out.valorunico = out.valorUnico; delete out.valorUnico; }
  if ('valorRecorrente' in out) { out.valorrecorrente = out.valorRecorrente; delete out.valorRecorrente; }
  if ('motivoPerda' in out) { out.motivoperda = out.motivoPerda; delete out.motivoPerda; }
  if ('dataCriacao' in out) { out.datacriacao = out.dataCriacao; delete out.dataCriacao; }
  if ('dataFechamento' in out) { out.datafechamento = out.dataFechamento; delete out.dataFechamento; }
  if ('anexoNome' in out) { out.anexonome = out.anexoNome; delete out.anexoNome; }

  // Tratamento de campos vazios para tipos específicos (Date, Number)
  // O Postgres rejeita "" para colunas de data ou número
  const dateFields = ['datacriacao', 'datafechamento'];
  const numFields  = ['valorunico', 'valorrecorrente'];

  dateFields.forEach(f => { if (out[f] === '') out[f] = null; });
  numFields.forEach(f =>  { if (out[f] === '') out[f] = 0;    });

  // Lista branca de colunas permitidas na tabela 'deals' para evitar erros 400
  const allowedColumns = [
    'id', 'created_at', 'empresa', 'nomenegocacao', 'valorunico', 'valorrecorrente', 
    'fonte', 'campanha', 'etapaid', 'motivoperda', 'datacriacao', 
    'datafechamento', 'produto', 'vendedor', 'anexo', 'anexonome'
  ];

  // Filtra o objeto para conter apenas as colunas válidas
  const filtered = {};
  allowedColumns.forEach(cat => {
    if (cat in out) filtered[cat] = out[cat];
  });
  
  return filtered;
};

// Normaliza colunas de tasks (retornadas em minúsculo pelo Postgres)
const normalizeTask = (t) => ({
  ...t,
  tipoTarefa:      t.tipoTarefa      ?? t.tipotarefa      ?? '',
  dataAgendamento: t.dataAgendamento ?? t.dataagendamento ?? '',
  valor:           t.valor           ?? 0,
  negociacao:      t.negociacao      ?? '',
  // Reconstrói dataHora para uso na UI (não existe no banco)
  dataHora: t.dataHora ?? (
    (t.dataAgendamento || t.dataagendamento)
      ? `${t.dataAgendamento || t.dataagendamento}T${t.horario || '00:00'}`
      : null
  ),
  responsaveis: t.responsaveis ?? t.vendedor ?? '',
});

// Converte campos camelCase para os nomes reais das colunas da tabela tasks
const toDbTask = (t) => {
  const out = { ...t };
  // Campos que NÃO existem na tabela — remover antes do insert/update
  delete out.dataHora;
  delete out.responsaveis;
  // Mapeamentos necessários
  if ('tipoTarefa'      in out) { out.tipotarefa      = out.tipoTarefa;      delete out.tipoTarefa; }
  if ('dataAgendamento' in out) { out.dataagendamento = out.dataAgendamento; delete out.dataAgendamento; }
  return out;
};

// Converte campos de contato (empresa) para os nomes reais das colunas e filtra permitidos
const toDbContact = (c) => {
  const allowed = [
    'id', 'empresa', 'documento', 'endereco', 'bairro', 'cidade', 
    'cep', 'uf', 'telefone', 'contatos', 'email', 'segmento', 'celular', 'vendedor'
  ];
  const out = {};
  allowed.forEach(col => { if (col in c) out[col] = c[col]; });
  return out;
};

// Converte campos de pessoa para os nomes reais das colunas e filtra permitidos
const toDbPerson = (p) => {
  const allowed = [
    'id', 'name', 'company_id', 'job_title', 'phones', 'emails', 'vendedor'
  ];
  const out = {};
  allowed.forEach(col => { if (col in p) out[col] = p[col]; });
  return out;
};

const CRMContext = createContext();

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error("useCRM must be used within a CRMProvider");
  return context;
};

// Funil de Vendas Base (Colunas)
const defaultStages = [
  { id: 'etapa-1', title: 'Lead Gerado' },
  { id: 'etapa-2', title: 'Lead Qualificado' },
  { id: 'etapa-3', title: 'Vistoria Técnica' },
  { id: 'etapa-4', title: 'Proposta Comercial' },
  { id: 'etapa-5', title: 'Pesquisa de Preço' },
  { id: 'etapa-6', title: 'Negociação' },
  { id: 'etapa-7', title: 'Perdemos' },
  { id: 'etapa-8', title: 'Vencemos' }
];

export const CRMProvider = ({ children }) => {
  const [stages] = useState(defaultStages);
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [segments, setSegments] = useState([]);
  const [lossReasons, setLossReasons] = useState([]);
  const [people, setPeople] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega dados iniciais do Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          { data: dealsData },
          { data: contactsData },
          { data: fleetData },
          { data: tasksData },
          { data: usersData },
          { data: campaignsData },
          { data: leadSourcesData },
          { data: segmentsData },
          { data: lossReasonsData },
          { data: peopleData },
          { data: attachmentsData }
        ] = await Promise.all([
          supabase.from('deals').select('*').order('created_at', { ascending: false }),
          supabase.from('contacts').select('*').order('empresa'),
          supabase.from('fleet').select('*').order('nome'),
          supabase.from('tasks').select('*').order('created_at', { ascending: false }),
          supabase.from('users_crm').select('*').order('nome'),
          supabase.from('campaigns').select('*').order('nome'),
          supabase.from('lead_sources').select('*').order('nome'),
          supabase.from('segments').select('*').order('nome'),
          supabase.from('loss_reasons').select('*').order('nome'),
          supabase.from('individual_contacts').select('*').order('name'),
          supabase.from('attachments').select('*').order('created_at', { ascending: false })
        ]);

        if (dealsData) setDeals(dealsData.map(normalizeDeal));
        if (contactsData) setContacts(contactsData);
        if (fleetData) setFleet(fleetData);
        if (tasksData) setTasks(tasksData.map(normalizeTask));
        if (usersData) setUsers(usersData);
        if (campaignsData) setCampaigns(campaignsData);
        if (leadSourcesData) setLeadSources(leadSourcesData);
        if (segmentsData) setSegments(segmentsData);
        if (lossReasonsData) setLossReasons(lossReasonsData);
        if (peopleData) setPeople(peopleData);
        if (attachmentsData) setAttachments(attachmentsData);

      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const addDeal = async (dealData) => {
    const formattedDeal = { 
      ...dealData, 
      datacriacao: dealData.dataCriacao || dealData.datacriacao || format(new Date(), 'yyyy-MM-dd'), 
      motivoperda: null 
    };
    delete formattedDeal.dataCriacao;
    delete formattedDeal.motivoPerda;
    
    const dbPayload = toDbDeal(formattedDeal);
    console.log("Saving new deal to DB (filtered):", dbPayload);

    const { data, error } = await supabase.from('deals').insert([dbPayload]).select();
    
    if (error) {
      console.error("Erro detalhado do Supabase:", error.message, error.details, error.hint);
      alert("Erro ao salvar no banco de dados: " + error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log("Successfully saved deal:", data[0]);
      setDeals(prev => [normalizeDeal(data[0]), ...prev]);
    }
  };

  const addContact = async (contactData) => {
    const dbPayload = toDbContact(contactData);
    const { data, error } = await supabase.from('contacts').insert([dbPayload]).select();
    if (!error && data) setContacts(prev => [data[0], ...prev]);
    else {
      console.error("Erro ao adicionar contato:", error);
      alert("Erro ao adicionar empresa: " + (error.message || JSON.stringify(error)));
    }
  };

  const addFleetItem = async (fleetData) => {
    const { data, error } = await supabase.from('fleet').insert([fleetData]).select();
    if (!error && data) setFleet(prev => [data[0], ...prev]);
    else console.error("Erro ao adicionar item da frota:", error);
  };

  const addTask = async (taskData) => {
    const dbPayload = toDbTask(taskData);
    const { data, error } = await supabase.from('tasks').insert([dbPayload]).select();
    if (!error && data) setTasks(prev => [normalizeTask(data[0]), ...prev]);
    else console.error("Erro ao adicionar tarefa:", error);
  };

  const addUser = async (userData) => {
    const { data, error } = await supabase.from('users_crm').insert([userData]).select();
    if (!error && data) setUsers(prev => [data[0], ...prev]);
    else console.error("Erro ao adicionar usuário:", error);
  };

  const addCampaign = async (campaignData) => {
    const { data, error } = await supabase.from('campaigns').insert([campaignData]).select();
    if (!error && data) setCampaigns(prev => [data[0], ...prev]);
    else console.error("Erro ao adicionar campanha:", error);
  };

  const addLeadSource = async (sourceData) => {
    const { data, error } = await supabase.from('lead_sources').insert([sourceData]).select();
    if (!error && data) setLeadSources(prev => [data[0], ...prev]);
    else console.error("Erro ao adicionar fonte de lead:", error);
  };

  const addSegment = async (segmentData) => {
    const { data, error } = await supabase.from('segments').insert([segmentData]).select();
    if (!error && data) setSegments(prev => [data[0], ...prev]);
    else console.error("Erro ao adicionar segmento:", error);
  };

  const addLossReason = async (reasonData) => {
    const { data, error } = await supabase.from('loss_reasons').insert([reasonData]).select();
    if (!error && data) setLossReasons(prev => [data[0], ...prev]);
    else console.error("Erro ao adicionar motivo de perda:", error);
  };

  const addPerson = async (personData) => {
    const dbPayload = toDbPerson(personData);
    const { data, error } = await supabase.from('individual_contacts').insert([dbPayload]).select();
    if (!error && data) setPeople(prev => [data[0], ...prev]);
    else {
      console.error("Erro ao adicionar pessoa:", error);
      alert("Erro ao adicionar contato (pessoa): " + (error.message || JSON.stringify(error)));
    }
  };

  const addAttachment = async (attachmentData) => {
    const { data, error } = await supabase.from('attachments').insert([attachmentData]).select();
    if (!error && data) {
      setAttachments(prev => [data[0], ...prev]);
      return data[0];
    } else {
      console.error("Erro ao salvar anexo no banco:", error);
      throw error;
    }
  };

  const deleteAttachment = async (attachmentId, filePath) => {
    // 1. Deletar do Storage
    const { error: storageError } = await supabase.storage.from('crm-attachments').remove([filePath]);
    if (storageError) {
      console.error("Erro ao deletar do storage:", storageError);
    }

    // 2. Deletar do Banco
    const { error: dbError } = await supabase.from('attachments').delete().eq('id', attachmentId);
    if (!dbError) {
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } else {
      console.error("Erro ao deletar anexo do banco:", dbError);
      throw dbError;
    }
  };

  const bulkAddContacts = async (contactsArray) => {
    const { data, error } = await supabase.from('contacts').insert(contactsArray).select();
    if (!error && data) {
      setContacts(prev => [...data, ...prev]);
      return { success: true, count: data.length };
    } else {
      console.error("Erro na importação em massa de contatos:", error);
      return { success: false, error };
    }
  };

  const bulkAddDeals = async (dealsArray) => {
    const dbDeals = dealsArray.map(toDbDeal);
    const { data, error } = await supabase.from('deals').insert(dbDeals).select();
    if (!error && data) {
      const normalized = data.map(normalizeDeal);
      setDeals(prev => [...normalized, ...prev]);
      return { success: true, count: data.length };
    } else {
      console.error("Erro na importação em massa de negócios:", error);
      return { success: false, error };
    }
  };

  const updateDeal = async (id, updatedFields) => {
    const dbPayload = toDbDeal(updatedFields);
    const { data, error } = await supabase.from('deals').update(dbPayload).eq('id', id).select();
    if (!error && data) setDeals(prev => prev.map(d => d.id === id ? normalizeDeal(data[0]) : d));
    else console.error("Erro ao atualizar negócio:", error);
  };

  const updateContact = async (id, updatedFields) => {
    const dbPayload = toDbContact(updatedFields);
    const { data, error } = await supabase.from('contacts').update(dbPayload).eq('id', id).select();
    if (!error && data) setContacts(prev => prev.map(c => c.id === id ? data[0] : c));
    else {
      console.error("Erro ao atualizar contato:", error);
      alert("Erro ao atualizar empresa: " + (error.message || JSON.stringify(error)));
    }
  };

  const updateFleetItem = async (id, updatedFields) => {
    const { data, error } = await supabase.from('fleet').update(updatedFields).eq('id', id).select();
    if (!error && data) setFleet(prev => prev.map(f => f.id === id ? data[0] : f));
    else console.error("Erro ao atualizar item da frota:", error);
  };

  const updateTask = async (id, updatedFields) => {
    const dbPayload = toDbTask(updatedFields);
    const { data, error } = await supabase.from('tasks').update(dbPayload).eq('id', id).select();
    if (!error && data) setTasks(prev => prev.map(t => t.id === id ? normalizeTask(data[0]) : t));
    else console.error("Erro ao atualizar tarefa:", error);
  };

  const updateUser = async (id, updatedFields) => {
    const { data, error } = await supabase.from('users_crm').update(updatedFields).eq('id', id).select();
    if (!error && data) setUsers(prev => prev.map(u => u.id === id ? data[0] : u));
    else console.error("Erro ao atualizar usuário:", error);
  };

  const updateCampaign = async (id, updatedFields) => {
    const { data, error } = await supabase.from('campaigns').update(updatedFields).eq('id', id).select();
    if (!error && data) setCampaigns(prev => prev.map(c => c.id === id ? data[0] : c));
    else console.error("Erro ao atualizar campanha:", error);
  };

  const updateLeadSource = async (id, updatedFields) => {
    const { data, error } = await supabase.from('lead_sources').update(updatedFields).eq('id', id).select();
    if (!error && data) setLeadSources(prev => prev.map(s => s.id === id ? data[0] : s));
    else console.error("Erro ao atualizar fonte de lead:", error);
  };

  const updateSegment = async (id, updatedFields) => {
    const { data, error } = await supabase.from('segments').update(updatedFields).eq('id', id).select();
    if (!error && data) setSegments(prev => prev.map(s => s.id === id ? data[0] : s));
    else console.error("Erro ao atualizar segmento:", error);
  };

  const updateLossReason = async (id, updatedFields) => {
    const { data, error } = await supabase.from('loss_reasons').update(updatedFields).eq('id', id).select();
    if (!error && data) setLossReasons(prev => prev.map(s => s.id === id ? data[0] : s));
    else console.error("Erro ao atualizar motivo de perda:", error);
  };

  const updatePerson = async (id, updatedFields) => {
    const dbPayload = toDbPerson(updatedFields);
    const { data, error } = await supabase.from('individual_contacts').update(dbPayload).eq('id', id).select();
    if (!error && data) setPeople(prev => prev.map(p => p.id === id ? data[0] : p));
    else {
      console.error("Erro ao atualizar pessoa:", error);
      alert("Erro ao atualizar contato (pessoa): " + (error.message || JSON.stringify(error)));
    }
  };

  const moveDeal = async (dealId, targetStageId, motivoPerda = null) => {
    const updateFields = {
      etapaid: targetStageId,
      motivoperda: motivoPerda,
      datafechamento: (targetStageId === 'etapa-7' || targetStageId === 'etapa-8') ? format(new Date(), 'yyyy-MM-dd') : null
    };
    const { data, error } = await supabase.from('deals').update(updateFields).eq('id', dealId).select();
    if (!error && data) setDeals(prev => prev.map(d => d.id === dealId ? normalizeDeal(data[0]) : d));
    else console.error("Erro ao mover negócio:", error);
  };

  const deleteDeal = async (dealId) => {
    const { error } = await supabase.from('deals').delete().eq('id', dealId);
    if (!error) setDeals(prev => prev.filter(d => d.id !== dealId));
    else console.error("Erro ao deletar negócio:", error);
  };

  const deleteContact = async (contactId) => {
    const { error } = await supabase.from('contacts').delete().eq('id', contactId);
    if (!error) setContacts(prev => prev.filter(c => c.id !== contactId));
    else console.error("Erro ao deletar contato:", error);
  };

  const deleteFleetItem = async (fleetId) => {
    const { error } = await supabase.from('fleet').delete().eq('id', fleetId);
    if (!error) setFleet(prev => prev.filter(f => f.id !== fleetId));
    else console.error("Erro ao deletar item da frota:", error);
  };

  const deleteTask = async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) setTasks(prev => prev.filter(t => t.id !== taskId));
    else console.error("Erro ao deletar tarefa:", error);
  };

  const deleteUser = async (userId) => {
    const { error } = await supabase.from('users_crm').delete().eq('id', userId);
    if (!error) setUsers(prev => prev.filter(u => u.id !== userId));
    else console.error("Erro ao deletar usuário:", error);
  };

  const deleteCampaign = async (campaignId) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
    if (!error) setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    else console.error("Erro ao deletar campanha:", error);
  };

  const deleteLeadSource = async (sourceId) => {
    const { error } = await supabase.from('lead_sources').delete().eq('id', sourceId);
    if (!error) setLeadSources(prev => prev.filter(s => s.id !== sourceId));
    else console.error("Erro ao deletar fonte de lead:", error);
  };

  const deleteSegment = async (segmentId) => {
    const { error } = await supabase.from('segments').delete().eq('id', segmentId);
    if (!error) setSegments(prev => prev.filter(s => s.id !== segmentId));
    else console.error("Erro ao deletar segmento:", error);
  };

  const deleteLossReason = async (reasonId) => {
    const { error } = await supabase.from('loss_reasons').delete().eq('id', reasonId);
    if (!error) setLossReasons(prev => prev.filter(s => s.id !== reasonId));
    else console.error("Erro ao deletar motivo de perda:", error);
  };

  const deletePerson = async (personId) => {
    const { error } = await supabase.from('individual_contacts').delete().eq('id', personId);
    if (!error) setPeople(prev => prev.filter(p => p.id !== personId));
    else console.error("Erro ao deletar pessoa:", error);
  };

  const bulkTransfer = async (sourceSeller, targetSeller, options) => {
    try {
      if (options.transferDeals) {
        const { error } = await supabase.from('deals').update({ vendedor: targetSeller }).eq('vendedor', sourceSeller);
        if (error) throw error;
      }
      if (options.transferContacts) {
        const { error } = await supabase.from('contacts').update({ vendedor: targetSeller }).eq('vendedor', sourceSeller);
        if (error) throw error;
      }
      if (options.transferTasks) {
        const { error } = await supabase.from('tasks').update({ vendedor: targetSeller }).eq('vendedor', sourceSeller);
        if (error) throw error;
      }

      // Refresh data locally
      if (options.transferDeals) {
        setDeals(prev => prev.map(d => d.vendedor === sourceSeller ? { ...d, vendedor: targetSeller } : d));
      }
      if (options.transferContacts) {
        setContacts(prev => prev.map(c => c.vendedor === sourceSeller ? { ...c, vendedor: targetSeller } : c));
      }
      if (options.transferTasks) {
        setTasks(prev => prev.map(t => t.vendedor === sourceSeller ? { ...t, vendedor: targetSeller, responsaveis: targetSeller } : t));
      }

      return { success: true };
    } catch (error) {
      console.error("Erro ao transferir em massa:", error);
      return { success: false, error };
    }
  };

  return (
    <CRMContext.Provider value={{
      stages,
      lossReasons,
      deals,
      contacts,
      fleet,
      tasks,
      users,
      campaigns,
      leadSources,
      segments,
      addDeal,
      addContact,
      addFleetItem,
      addTask,
      addUser,
      addCampaign,
      addLeadSource,
      addSegment,
      addLossReason,
      addPerson,
      bulkAddContacts,
      bulkAddDeals,
      updateDeal,
      updateContact,
      updateFleetItem,
      updateTask,
      updateUser,
      updateCampaign,
      updateLeadSource,
      updateSegment,
      updateLossReason,
      updatePerson,
      deleteDeal,
      deleteContact,
      deleteFleetItem,
      deleteTask,
      deleteUser,
      deleteCampaign,
      deleteLeadSource,
      deleteSegment,
      deleteLossReason,
      deletePerson,
      moveDeal,
      bulkTransfer,
      addAttachment,
      deleteAttachment,
      attachments,
      people,
      isLoading
    }}>
      {children}
    </CRMContext.Provider>
  );
};

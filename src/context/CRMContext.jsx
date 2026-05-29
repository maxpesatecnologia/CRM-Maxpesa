import { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

// ---------------------------------------------------------------------------
// Normalização: Supabase retorna colunas em minúsculo, a UI usa camelCase
// ---------------------------------------------------------------------------
const normalizeDeal = (d) => {
  const n = {
    ...d,
    etapaId:        d.etapaId        ?? d.etapaid        ?? 'etapa-1',
    valorUnico:      Number(d.valorUnico      ?? d.valorunico      ?? 0),
    valorRecorrente: Number(d.valorRecorrente ?? d.valorrecorrente ?? 0),
    motivoPerda:    d.motivoPerda    ?? d.motivoperda    ?? null,
    dataCriacao:    d.dataCriacao    ?? d.datacriacao    ?? null,
    dataFechamento: d.dataFechamento ?? d.datafechamento ?? null,
  };
  delete n.etapaid; delete n.valorunico; delete n.valorrecorrente;
  delete n.motivoperda; delete n.datacriacao; delete n.datafechamento;
  return n;
};

const toDbDeal = (d) => {
  const out = { ...d };
  if ('etapaId'        in out) { out.etapaid        = out.etapaId;        delete out.etapaId; }
  if ('valorUnico'     in out) { out.valorunico      = out.valorUnico;     delete out.valorUnico; }
  if ('valorRecorrente' in out) { out.valorrecorrente = out.valorRecorrente; delete out.valorRecorrente; }
  if ('motivoPerda'    in out) { out.motivoperda     = out.motivoPerda;    delete out.motivoPerda; }
  if ('dataCriacao'    in out) { out.datacriacao     = out.dataCriacao;    delete out.dataCriacao; }
  if ('dataFechamento' in out) { out.datafechamento  = out.dataFechamento; delete out.dataFechamento; }

  ['datacriacao', 'datafechamento'].forEach(f => { if (out[f] === '') out[f] = null; });
  ['valorunico', 'valorrecorrente'].forEach(f =>  { if (out[f] === '') out[f] = 0; });

  const allowed = [
    'id', 'created_at', 'empresa', 'valorunico', 'valorrecorrente',
    'fonte', 'campanha', 'etapaid', 'motivoperda', 'datacriacao',
    'datafechamento', 'produto', 'vendedor', 'nomeNegocacao', 'anexo', 'anexoNome',
  ];
  return Object.fromEntries(allowed.filter(k => k in out).map(k => [k, out[k]]));
};

const normalizeTask = (t) => ({
  ...t,
  tipoTarefa:      t.tipoTarefa      ?? t.tipotarefa      ?? '',
  dataAgendamento: t.dataAgendamento ?? t.dataagendamento ?? '',
  valor:           t.valor           ?? 0,
  negociacao:      t.negociacao      ?? '',
  dataHora: t.dataHora ?? (
    (t.dataAgendamento || t.dataagendamento)
      ? `${t.dataAgendamento || t.dataagendamento}T${t.horario || '00:00'}`
      : null
  ),
  responsaveis: t.responsaveis ?? t.vendedor ?? '',
});

const toDbTask = (t) => {
  const out = { ...t };
  delete out.dataHora;
  delete out.responsaveis;
  if ('tipoTarefa'      in out) { out.tipotarefa      = out.tipoTarefa;      delete out.tipoTarefa; }
  if ('dataAgendamento' in out) { out.dataagendamento = out.dataAgendamento; delete out.dataAgendamento; }
  return out;
};

// ---------------------------------------------------------------------------

const CRMContext = createContext();

export const useCRM = () => {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within a CRMProvider');
  return ctx;
};

const defaultStages = [
  { id: 'etapa-1', title: 'Lead Gerado' },
  { id: 'etapa-2', title: 'Lead Qualificado' },
  { id: 'etapa-3', title: 'Vistoria Técnica' },
  { id: 'etapa-4', title: 'Proposta Comercial' },
  { id: 'etapa-5', title: 'Pesquisa de Preço' },
  { id: 'etapa-6', title: 'Negociação' },
  { id: 'etapa-7', title: 'Perdemos' },
  { id: 'etapa-8', title: 'Vencemos' },
];

export const CRMProvider = ({ children }) => {
  const toast = useToast();

  const [stages]      = useState(defaultStages);
  const [deals,        setDeals]        = useState([]);
  const [contacts,     setContacts]     = useState([]);
  const [fleet,        setFleet]        = useState([]);
  const [tasks,        setTasks]        = useState([]);
  const [users,        setUsers]        = useState([]);
  const [campaigns,    setCampaigns]    = useState([]);
  const [leadSources,  setLeadSources]  = useState([]);
  const [segments,     setSegments]     = useState([]);
  const [lossReasons,  setLossReasons]  = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);

  // Carrega todos os dados na montagem
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
        ]);

        if (dealsData)       setDeals(dealsData.map(normalizeDeal));
        if (contactsData)    setContacts(contactsData);
        if (fleetData)       setFleet(fleetData);
        if (tasksData)       setTasks(tasksData.map(normalizeTask));
        if (usersData)       setUsers(usersData);
        if (campaignsData)   setCampaigns(campaignsData);
        if (leadSourcesData) setLeadSources(leadSourcesData);
        if (segmentsData)    setSegments(segmentsData);
        if (lossReasonsData) setLossReasons(lossReasonsData);
      } catch (err) {
        toast.error('Erro ao carregar dados: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Factory: gera add / update / remove para qualquer tabela
  // ---------------------------------------------------------------------------
  const makeCRUD = (tableName, setter, normalize = x => x, toDb = x => x) => ({
    async add(data) {
      const { data: r, error } = await supabase.from(tableName).insert([toDb(data)]).select();
      if (error) { toast.error('Erro ao salvar: ' + error.message); return null; }
      setter(prev => [normalize(r[0]), ...prev]);
      toast.success('Salvo com sucesso!');
      return r[0];
    },
    async update(id, fields) {
      const { data: r, error } = await supabase.from(tableName).update(toDb(fields)).eq('id', id).select();
      if (error) { toast.error('Erro ao atualizar: ' + error.message); return null; }
      setter(prev => prev.map(x => x.id === id ? normalize(r[0]) : x));
      return r[0];
    },
    async remove(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) { toast.error('Erro ao excluir: ' + error.message); return false; }
      setter(prev => prev.filter(x => x.id !== id));
      return true;
    },
  });

  const contacts$    = makeCRUD('contacts',     setContacts);
  const fleet$       = makeCRUD('fleet',         setFleet);
  const tasks$       = makeCRUD('tasks',         setTasks,        normalizeTask, toDbTask);
  const campaigns$   = makeCRUD('campaigns',     setCampaigns);
  const leadSources$ = makeCRUD('lead_sources',  setLeadSources);
  const segments$    = makeCRUD('segments',       setSegments);
  const lossReasons$ = makeCRUD('loss_reasons',  setLossReasons);
  const users$       = makeCRUD('users_crm',     setUsers);

  // ---------------------------------------------------------------------------
  // Usuários — cria conta no Supabase Auth + registro em users_crm
  // ---------------------------------------------------------------------------
  const addUser = async ({ nome, email, senha, perfil, status }) => {
    // 1. Cria a conta de autenticação
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { full_name: nome } },
    });

    if (authError) {
      toast.error('Erro ao criar conta de acesso: ' + authError.message);
      return null;
    }

    const authUserId = authData.user?.id;

    // 2. Insere o registro CRM (o trigger handle_new_user pode já ter inserido — trata duplicata)
    const { data, error } = await supabase
      .from('users_crm')
      .upsert([{ id: authUserId, nome, email, perfil, status }], { onConflict: 'id' })
      .select();

    if (error) {
      toast.error('Conta criada mas erro ao salvar perfil CRM: ' + error.message);
      return null;
    }

    setUsers(prev => {
      const exists = prev.some(u => u.id === authUserId);
      return exists
        ? prev.map(u => u.id === authUserId ? data[0] : u)
        : [data[0], ...prev];
    });

    if (!authData.user?.email_confirmed_at) {
      toast.info('Usuário criado! Um e-mail de confirmação foi enviado para ' + email + '.');
    } else {
      toast.success('Vendedor criado com sucesso!');
    }
    return data[0];
  };

  // ---------------------------------------------------------------------------
  // Deals — tratamento especial (formatação de data e colunas permitidas)
  // ---------------------------------------------------------------------------
  const addDeal = async (dealData) => {
    const isClosedStage = dealData.etapaId === 'etapa-7' || dealData.etapaId === 'etapa-8';
    const today = format(new Date(), 'yyyy-MM-dd');
    const payload = toDbDeal({
      ...dealData,
      datacriacao:    dealData.dataCriacao    || dealData.datacriacao    || today,
      // auto-preenche dataFechamento quando deal é criado direto numa etapa fechada
      datafechamento: dealData.dataFechamento || dealData.datafechamento || (isClosedStage ? today : null),
      motivoperda: null,
      dataCriacao:    undefined,
      motivoPerda:    undefined,
      dataFechamento: undefined,
    });
    const { data, error } = await supabase.from('deals').insert([payload]).select();
    if (error) { toast.error('Erro ao salvar negócio: ' + error.message); return; }
    if (data?.length) {
      setDeals(prev => [normalizeDeal(data[0]), ...prev]);
      toast.success('Negócio adicionado!');
    }
  };

  const updateDeal = async (id, fields) => {
    const { data, error } = await supabase.from('deals').update(toDbDeal(fields)).eq('id', id).select();
    if (error) { toast.error('Erro ao atualizar negócio: ' + error.message); return; }
    if (data) setDeals(prev => prev.map(d => d.id === id ? normalizeDeal(data[0]) : d));
  };

  const deleteDeal = async (id) => {
    const { error } = await supabase.from('deals').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir negócio: ' + error.message); return; }
    setDeals(prev => prev.filter(d => d.id !== id));
  };

  const moveDeal = async (dealId, targetStageId, motivoPerda = null) => {
    const payload = {
      etapaid:       targetStageId,
      motivoperda:   motivoPerda,
      datafechamento: (targetStageId === 'etapa-7' || targetStageId === 'etapa-8')
        ? format(new Date(), 'yyyy-MM-dd') : null,
    };
    const { data, error } = await supabase.from('deals').update(payload).eq('id', dealId).select();
    if (error) { toast.error('Erro ao mover negócio: ' + error.message); return; }
    if (data) setDeals(prev => prev.map(d => d.id === dealId ? normalizeDeal(data[0]) : d));
  };

  // ---------------------------------------------------------------------------
  // Transferência em massa de dados entre vendedores
  // ---------------------------------------------------------------------------
  const bulkTransfer = async (sourceSeller, targetSeller, options) => {
    try {
      if (options.transferDeals) {
        const { error } = await supabase.from('deals').update({ vendedor: targetSeller }).eq('vendedor', sourceSeller);
        if (error) throw error;
        setDeals(prev => prev.map(d => d.vendedor === sourceSeller ? { ...d, vendedor: targetSeller } : d));
      }
      if (options.transferContacts) {
        const { error } = await supabase.from('contacts').update({ vendedor: targetSeller }).eq('vendedor', sourceSeller);
        if (error) throw error;
        setContacts(prev => prev.map(c => c.vendedor === sourceSeller ? { ...c, vendedor: targetSeller } : c));
      }
      if (options.transferTasks) {
        const { error } = await supabase.from('tasks').update({ vendedor: targetSeller }).eq('vendedor', sourceSeller);
        if (error) throw error;
        setTasks(prev => prev.map(t =>
          t.vendedor === sourceSeller ? { ...t, vendedor: targetSeller, responsaveis: targetSeller } : t
        ));
      }
      toast.success('Transferência concluída com sucesso!');
      return { success: true };
    } catch (err) {
      toast.error('Erro na transferência: ' + err.message);
      return { success: false, error: err };
    }
  };

  return (
    <CRMContext.Provider value={{
      stages, isLoading,
      deals, contacts, fleet, tasks, users, campaigns, leadSources, segments, lossReasons,

      // Deals
      addDeal, updateDeal, deleteDeal, moveDeal,

      // Demais entidades (geradas pelo makeCRUD)
      addContact:      contacts$.add,    updateContact:      contacts$.update,    deleteContact:      contacts$.remove,
      addFleetItem:    fleet$.add,       updateFleetItem:    fleet$.update,       deleteFleetItem:    fleet$.remove,
      addTask:         tasks$.add,       updateTask:         tasks$.update,       deleteTask:         tasks$.remove,
      addUser,                            updateUser:         users$.update,       deleteUser:         users$.remove,
      addCampaign:     campaigns$.add,   updateCampaign:     campaigns$.update,   deleteCampaign:     campaigns$.remove,
      addLeadSource:   leadSources$.add, updateLeadSource:   leadSources$.update, deleteLeadSource:   leadSources$.remove,
      addSegment:      segments$.add,    updateSegment:      segments$.update,    deleteSegment:      segments$.remove,
      addLossReason:   lossReasons$.add, updateLossReason:   lossReasons$.update, deleteLossReason:   lossReasons$.remove,

      bulkTransfer,
    }}>
      {children}
    </CRMContext.Provider>
  );
};

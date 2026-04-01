import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

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

const lossReasons = [
  'Cliente não respondeu',
  'Preço',
  'Credito recusado',
  'Documentação',
  'Outra região',
  'Não realizamos a atividade',
  'Demora no envio da cotação',
  'Outros',
  'Indisponibilidade de equipamento',
  'Declinado cliente'
];

export const CRMProvider = ({ children }) => {
  const [stages] = useState(defaultStages);
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [fleet, setFleet] = useState([]); // <-- Novo estado para a frota
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]); // <-- Novo estado para usuarios
  const [isLoading, setIsLoading] = useState(true);

  // Inicializa com dados fictícios baseados na planilha modelo para teste
  useEffect(() => {
    const localDeals = localStorage.getItem('@RDCrmClone:deals');
    const localContacts = localStorage.getItem('@RDCrmClone:contacts');

    if (localDeals) setDeals(JSON.parse(localDeals));
    else {
      const mockDeals = [
        { id: uuidv4(), empresa: 'MONTO INDUSTRIAL LTDA', etapaId: 'etapa-7', motivoPerda: 'Preço', valorUnico: 2014700.00, valorRecorrente: 0.0, dataCriacao: '2024-07-12', dataFechamento: '2024-07-17', fonte: 'Contato por Email', campanha: '' },
        { id: uuidv4(), empresa: 'RODENSTOCK BRASIL', etapaId: 'etapa-6', motivoPerda: null, valorUnico: 23250.00, valorRecorrente: 0.0, dataCriacao: '2024-07-12', dataFechamento: null, fonte: 'Contato por Telefone', campanha: '' }
      ];
      setDeals(mockDeals);
      localStorage.setItem('@RDCrmClone:deals', JSON.stringify(mockDeals));
    }

    if (localContacts) setContacts(JSON.parse(localContacts));
    else {
      const mockContacts = [
        { id: uuidv4(), empresa: 'MONTO INDUSTRIAL LTDA', documento: '12.345.678/0001-90', endereco: 'Rua das Indústrias, 100 - SP', telefone: '(11) 99999-1234', contatos: 'Carlos Montes', email: 'carlos@monto.com.br', segmento: 'Indústria' },
        { id: uuidv4(), empresa: 'RODENSTOCK BRASIL', documento: '98.765.432/0001-10', endereco: 'Av. Paulista, 1000 - SP', telefone: '(11) 3232-4444', contatos: 'Ana Luisa', email: 'ana@rodenstock.com', segmento: 'Tecnologia' }
      ];
      setContacts(mockContacts);
      localStorage.setItem('@RDCrmClone:contacts', JSON.stringify(mockContacts));
    }

    const localFleet = localStorage.getItem('@RDCrmClone:fleet');
    if (localFleet) setFleet(JSON.parse(localFleet));
    else {
      const mockFleet = [
        { id: uuidv4(), nome: 'Guindaste XCMG QY70K', descricao: 'Guindaste rodoviário de 70 toneladas, ideal para içamentos pesados e canteiros de obra.', valor: 2500.00, exibirNaNegociacao: true },
        { id: uuidv4(), nome: 'Caminhão Munck 15T', descricao: 'Equipamento versátil para movimentação de cargas pátio/indústria.', valor: 1200.00, exibirNaNegociacao: true }
      ];
      setFleet(mockFleet);
      localStorage.setItem('@RDCrmClone:fleet', JSON.stringify(mockFleet));
    }

    const localTasks = localStorage.getItem('@RDCrmClone:tasks');
    if (localTasks) setTasks(JSON.parse(localTasks));
    else {
      // Create mock deal references locally since we know the initial mock deals exist above.
      // We will match the company name "MONTO INDUSTRIAL LTDA" (etapa-7) and "RODENSTOCK BRASIL".
      // Let's just create generic mock tasks that do not crash if the ID isn't linked immediately.
      setTasks([]); 
    }

    const localUsers = localStorage.getItem('@RDCrmClone:users');
    if (localUsers) setUsers(JSON.parse(localUsers));
    else {
      const mockUsers = [
        { id: uuidv4(), nome: 'Admin Principal', email: 'admin@empresa.com.br', perfil: 'Administrador', status: 'Ativo' },
        { id: uuidv4(), nome: 'João Pedro', email: 'joao.pedro@empresa.com.br', perfil: 'Usuário', status: 'Ativo' }
      ];
      setUsers(mockUsers);
      localStorage.setItem('@RDCrmClone:users', JSON.stringify(mockUsers));
    }

    setIsLoading(false);
  }, []);

  // Sincroniza estado com LocalStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('@RDCrmClone:deals', JSON.stringify(deals));
      localStorage.setItem('@RDCrmClone:contacts', JSON.stringify(contacts));
      localStorage.setItem('@RDCrmClone:fleet', JSON.stringify(fleet));
      localStorage.setItem('@RDCrmClone:tasks', JSON.stringify(tasks));
      localStorage.setItem('@RDCrmClone:users', JSON.stringify(users));
    }
  }, [deals, contacts, fleet, tasks, users, isLoading]);

  const addDeal = (dealData) => {
    const newDeal = { ...dealData, id: uuidv4(), dataCriacao: format(new Date(), 'yyyy-MM-dd'), motivoPerda: null };
    setDeals([...deals, newDeal]);
  };

  const addContact = (contactData) => {
    const newContact = { ...contactData, id: uuidv4(), dataCriacao: format(new Date(), 'yyyy-MM-dd') };
    setContacts([...contacts, newContact]);
  };

  const addFleetItem = (fleetData) => {
    const newItem = { ...fleetData, id: uuidv4() };
    setFleet([...fleet, newItem]);
  };

  const addTask = (taskData) => {
    const newTask = { ...taskData, id: uuidv4() };
    setTasks([...tasks, newTask]);
  };

  const addUser = (userData) => {
    const newUser = { ...userData, id: uuidv4() };
    setUsers([...users, newUser]);
  };

  const updateDeal = (id, updatedFields) => {
    setDeals(deals.map(d => d.id === id ? { ...d, ...updatedFields } : d));
  };

  const updateFleetItem = (id, updatedFields) => {
    setFleet(fleet.map(f => f.id === id ? { ...f, ...updatedFields } : f));
  };

  const updateTask = (id, updatedFields) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updatedFields } : t));
  };

  const updateUser = (id, updatedFields) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updatedFields } : u));
  };

  const moveDeal = (dealId, targetStageId, motivoPerda = null) => {
    updateDeal(dealId, {
      etapaId: targetStageId,
      motivoPerda,
      dataFechamento: (targetStageId === 'etapa-7' || targetStageId === 'etapa-8') ? format(new Date(), 'yyyy-MM-dd') : null
    });
  };

  const deleteDeal = (dealId) => {
    setDeals(deals.filter(d => d.id !== dealId));
  };

  const deleteFleetItem = (fleetId) => {
    setFleet(fleet.filter(f => f.id !== fleetId));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const deleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
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
      addDeal,
      addContact,
      addFleetItem,
      addTask,
      addUser,
      updateDeal,
      updateFleetItem,
      updateTask,
      updateUser,
      deleteDeal,
      deleteFleetItem,
      deleteTask,
      deleteUser,
      moveDeal,
      isLoading
    }}>
      {children}
    </CRMContext.Provider>
  );
};

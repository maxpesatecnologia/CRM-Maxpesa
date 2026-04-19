import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, Search, User, Building2, Phone, Mail, X, Trash2, Briefcase, PlusCircle } from 'lucide-react';
import './People.css';

const People = () => {
  const { people, contacts, addPerson, updatePerson, deletePerson } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    company_id: '',
    job_title: '',
    phones: [''],
    emails: [''],
    vendedor: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.company_id) {
      alert("Por favor, preencha o nome e selecione uma empresa.");
      return;
    }

    // Filtrar campos vazios
    const payload = {
      ...form,
      phones: form.phones.filter(p => p.trim() !== ''),
      emails: form.emails.filter(e => e.trim() !== '')
    };
    
    if (form.id) {
      const { id, ...updatedFields } = payload;
      updatePerson(id, updatedFields);
    } else {
      addPerson(payload);
    }
    
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm({ name: '', company_id: '', job_title: '', phones: [''], emails: [''], vendedor: '' });
  };

  const handleEdit = (person) => {
    setForm({
      ...person,
      phones: person.phones.length > 0 ? person.phones : [''],
      emails: person.emails.length > 0 ? person.emails : ['']
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      deletePerson(id);
    }
  };

  const addPhone = () => setForm({ ...form, phones: [...form.phones, ''] });
  const removePhone = (index) => {
    const newPhones = form.phones.filter((_, i) => i !== index);
    setForm({ ...form, phones: newPhones.length > 0 ? newPhones : [''] });
  };
  const updatePhone = (index, val) => {
    const newPhones = [...form.phones];
    newPhones[index] = val;
    setForm({ ...form, phones: newPhones });
  };

  const addEmail = () => setForm({ ...form, emails: [...form.emails, ''] });
  const removeEmail = (index) => {
    const newEmails = form.emails.filter((_, i) => i !== index);
    setForm({ ...form, emails: newEmails.length > 0 ? newEmails : [''] });
  };
  const updateEmail = (index, val) => {
    const newEmails = [...form.emails];
    newEmails[index] = val;
    setForm({ ...form, emails: newEmails });
  };

  const getCompanyName = (id) => {
    const company = contacts.find(c => c.id === id);
    return company ? company.empresa : 'Empresa não encontrada';
  };

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    getCompanyName(p.company_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="people-wrapper">
      <div className="people-header">
        <div>
          <h1>Contatos</h1>
          <p>Gerencie as pessoas de contato das suas empresas.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Contato
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou empresa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>
      </div>

      <div className="people-table-container">
        <table className="people-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Empresa</th>
              <th>Cargo</th>
              <th>Telefones</th>
              <th>E-mails</th>
              <th style={{ width: '80px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPeople.map((person) => (
              <tr key={person.id}>
                <td>
                  <div className="people-name-cell">
                    <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-hover)', padding: '0.3rem', borderRadius: '4px' }}>
                      <User size={16} />
                    </div>
                    <strong>{person.name}</strong>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-muted" />
                    {getCompanyName(person.company_id)}
                  </div>
                </td>
                <td>{person.job_title || '-'}</td>
                <td>
                  <div className="badge-list">
                    {person.phones && person.phones.length > 0 ? person.phones.map((phone, i) => (
                      <span key={i} className="phone-badge"><Phone size={10} /> {phone}</span>
                    )) : '-'}
                  </div>
                </td>
                <td>
                  <div className="badge-list">
                    {person.emails && person.emails.length > 0 ? person.emails.map((email, i) => (
                      <span key={i} className="email-badge"><Mail size={10} /> {email}</span>
                    )) : '-'}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(person)} className="btn-icon" title="Editar"><Briefcase size={16} /></button>
                    <button onClick={() => handleDelete(person.id)} className="btn-icon text-danger" title="Excluir"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPeople.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum contato encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{form.id ? 'Editar Contato' : 'Novo Contato'}</h2>
              <button onClick={closeModal} className="btn-close"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Nome Completo *</label>
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome da pessoa" />
                </div>

                <div className="form-group">
                  <label>Empresa *</label>
                  <select required value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value})}>
                    <option value="">Selecione uma empresa...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.empresa}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Cargo</label>
                  <input type="text" value={form.job_title} onChange={e => setForm({...form, job_title: e.target.value})} placeholder="Ex: Gerente Comercial" />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Telefones</label>
                  <div className="dynamic-input-group">
                    {form.phones.map((phone, index) => (
                      <div key={index} className="dynamic-input-item">
                        <input 
                          type="text" 
                          value={phone} 
                          onChange={e => updatePhone(index, e.target.value)} 
                          placeholder="(00) 00000-0000" 
                        />
                        {form.phones.length > 1 && (
                          <button type="button" onClick={() => removePhone(index)} className="btn-remove-dynamic">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addPhone} className="btn-add-dynamic">
                      <PlusCircle size={14} /> Adicionar Telefone
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>E-mails</label>
                  <div className="dynamic-input-group">
                    {form.emails.map((email, index) => (
                      <div key={index} className="dynamic-input-item">
                        <input 
                          type="email" 
                          value={email} 
                          onChange={e => updateEmail(index, e.target.value)} 
                          placeholder="email@exemplo.com" 
                        />
                        {form.emails.length > 1 && (
                          <button type="button" onClick={() => removeEmail(index)} className="btn-remove-dynamic">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addEmail} className="btn-add-dynamic">
                      <PlusCircle size={14} /> Adicionar E-mail
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-primary">{form.id ? 'Salvar Alterações' : 'Criar Contato'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default People;

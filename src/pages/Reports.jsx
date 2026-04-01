import React, { useState, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileDown, FileUp, FileText, FileSpreadsheet, Table2,
  CheckCircle2, AlertCircle, Users, Briefcase, ListTodo, Truck
} from 'lucide-react';
import './Reports.css';

const Reports = () => {
  const { deals, contacts, tasks, users, fleet, stages, addContact, addDeal } = useCRM();
  const fileInputRef = useRef(null);

  const [importResult, setImportResult] = useState(null); // { success, count, error }
  const [importType, setImportType] = useState('contacts');
  const [exportType, setExportType] = useState('deals');

  // ────────────────── HELPERS ──────────────────
  const getStageTitle = (id) => stages.find(s => s.id === id)?.title || id;

  const formatCurrency = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  // ────────────────── DADOS PARA EXPORTAÇÃO ──────────────────
  const exportConfigs = {
    deals: {
      label: 'Negociações (Funil)',
      icon: <Briefcase size={18} />,
      headers: ['Empresa', 'Produto', 'Valor', 'Etapa', 'Data Criação'],
      rows: () => deals.map(d => [
        d.empresa, d.produto || '-',
        formatCurrency(d.valorUnico),
        getStageTitle(d.etapaId),
        d.dataCriacao || '-'
      ])
    },
    contacts: {
      label: 'Empresas / Contatos',
      icon: <Users size={18} />,
      headers: ['Empresa', 'CNPJ/CPF', 'Endereço', 'Cidade', 'UF', 'Telefone', 'E-mail', 'Segmento'],
      rows: () => contacts.map(c => [
        c.empresa, c.documento || '-',
        [c.endereco, c.bairro].filter(Boolean).join(', ') || '-',
        c.cidade || '-', c.uf || '-', c.telefone || '-', c.email || '-', c.segmento || '-'
      ])
    },
    tasks: {
      label: 'Tarefas',
      icon: <ListTodo size={18} />,
      headers: ['Assunto', 'Empresa', 'Tipo Tarefa', 'Vendedor', 'Data', 'Horário', 'Status'],
      rows: () => tasks.map(t => [
        t.assunto || t.titulo || '-',
        t.empresa || '-',
        t.tipoTarefa || '-',
        t.vendedor || t.responsaveis || '-',
        t.dataAgendamento || '-',
        t.horario || '-',
        t.concluida ? 'Concluída' : 'Pendente'
      ])
    },
    users: {
      label: 'Usuários / Vendedores',
      icon: <Users size={18} />,
      headers: ['Nome', 'E-mail', 'Perfil', 'Status'],
      rows: () => users.map(u => [u.nome, u.email, u.perfil, u.status])
    },
    fleet: {
      label: 'Produtos / Frota',
      icon: <Truck size={18} />,
      headers: ['Nome', 'Descrição', 'Valor', 'Exibir na Negociação'],
      rows: () => fleet.map(f => [
        f.nome, f.descricao || '-',
        formatCurrency(f.valor),
        f.exibirNaNegociacao ? 'Sim' : 'Não'
      ])
    }
  };

  // ────────────────── EXPORTAR CSV ──────────────────
  const exportCSV = () => {
    const cfg = exportConfigs[exportType];
    const rows = cfg.rows();
    const csvContent = [cfg.headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${exportType}_${today()}.csv`);
  };

  // ────────────────── EXPORTAR EXCEL ──────────────────
  const exportExcel = () => {
    const cfg = exportConfigs[exportType];
    const wsData = [cfg.headers, ...cfg.rows()];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, cfg.label.slice(0, 31));
    XLSX.writeFile(wb, `${exportType}_${today()}.xlsx`);
  };

  // ────────────────── EXPORTAR PDF ──────────────────
  const exportPDF = () => {
    const cfg = exportConfigs[exportType];
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.setTextColor(255, 42, 42);
    doc.text(`MAXPESA CRM — ${cfg.label}`, 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [cfg.headers],
      body: cfg.rows(),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [255, 42, 42], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`${exportType}_${today()}.pdf`);
  };

  // ────────────────── IMPORTAR ARQUIVO ──────────────────
  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!json.length) {
          setImportResult({ success: false, error: 'Arquivo vazio ou sem dados reconhecidos.' });
          return;
        }

        let count = 0;
        if (importType === 'contacts') {
          json.forEach(row => {
            addContact({
              empresa: row['Empresa'] || row['empresa'] || row['EMPRESA'] || '',
              documento: row['CNPJ/CPF'] || row['documento'] || '',
              endereco: row['Endereço'] || row['endereco'] || '',
              cidade: row['Cidade'] || row['cidade'] || '',
              uf: row['UF'] || row['uf'] || '',
              telefone: row['Telefone'] || row['telefone'] || '',
              email: row['E-mail'] || row['email'] || '',
              segmento: row['Segmento'] || row['segmento'] || '',
              bairro: row['Bairro'] || row['bairro'] || '',
              cep: row['CEP'] || row['cep'] || '',
              contatos: row['Contato'] || row['contatos'] || ''
            });
            count++;
          });
        } else if (importType === 'deals') {
          json.forEach(row => {
            addDeal({
              empresa: row['Empresa'] || row['empresa'] || '',
              produto: row['Produto'] || row['produto'] || '',
              valorUnico: parseFloat(String(row['Valor'] || row['valor'] || '0').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
              etapaId: 'etapa-1'
            });
            count++;
          });
        }

        setImportResult({ success: true, count });
      } catch (err) {
        setImportResult({ success: false, error: 'Erro ao ler o arquivo. Verifique o formato.' });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // ────────────────── BAIXAR TEMPLATE ──────────────────
  const downloadTemplate = () => {
    const templates = {
      contacts: [['Empresa', 'CNPJ/CPF', 'Endereço', 'Bairro', 'Cidade', 'UF', 'CEP', 'Telefone', 'Contato', 'E-mail', 'Segmento'],
                 ['Empresa Exemplo LTDA', '00.000.000/0001-00', 'Rua das Flores, 100', 'Centro', 'São Paulo', 'SP', '01000-000', '(11) 90000-0000', 'João Silva', 'joao@exemplo.com', 'Indústria']],
      deals: [['Empresa', 'Produto', 'Valor'],
              ['Empresa Exemplo', 'Guindaste 50T', '25000']]
    };
    const model = templates[importType] || templates.contacts;
    const ws = XLSX.utils.aoa_to_sheet(model);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `template_${importType}.xlsx`);
  };

  const today = () => new Date().toISOString().slice(0, 10);
  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const cfg = exportConfigs[exportType];

  return (
    <div className="reports-wrapper">
      <div className="reports-header">
        <div>
          <h1>Relatórios e Importação</h1>
          <p>Exporte seus dados em PDF, Excel ou CSV e importe bases de clientes e negociações.</p>
        </div>
      </div>

      <div className="reports-grid">

        {/* ───── BLOCO EXPORTAÇÃO ───── */}
        <div className="reports-card">
          <div className="reports-card-header">
            <FileDown size={22} className="card-icon export-icon" />
            <div>
              <h2>Exportar Relatório</h2>
              <span>Gere relatórios dos seus dados</span>
            </div>
          </div>

          <div className="form-group">
            <label>Selecione os dados para exportar</label>
            <div className="module-selector">
              {Object.entries(exportConfigs).map(([key, val]) => (
                <button
                  key={key}
                  className={`module-btn ${exportType === key ? 'active' : ''}`}
                  onClick={() => setExportType(key)}
                >
                  {val.icon} {val.label}
                </button>
              ))}
            </div>
          </div>

          <div className="export-info">
            <span className="export-count">
              {cfg.rows().length} registro(s) encontrado(s) para exportar
            </span>
          </div>

          <div className="export-buttons">
            <button className="export-btn pdf" onClick={exportPDF}>
              <FileText size={18} /> Exportar PDF
            </button>
            <button className="export-btn excel" onClick={exportExcel}>
              <FileSpreadsheet size={18} /> Exportar Excel
            </button>
            <button className="export-btn csv" onClick={exportCSV}>
              <Table2 size={18} /> Exportar CSV
            </button>
          </div>

          <div className="preview-table">
            <p className="preview-title">Pré-visualização (primeiras 3 linhas)</p>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>{cfg.headers.map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {cfg.rows().slice(0, 3).map((row, i) => (
                    <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                  ))}
                  {cfg.rows().length === 0 && (
                    <tr><td colSpan={cfg.headers.length} style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
                      Nenhum dado cadastrado ainda.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ───── BLOCO IMPORTAÇÃO ───── */}
        <div className="reports-card">
          <div className="reports-card-header">
            <FileUp size={22} className="card-icon import-icon" />
            <div>
              <h2>Importar Base de Dados</h2>
              <span>Importe via arquivo Excel ou CSV</span>
            </div>
          </div>

          <div className="form-group">
            <label>O que deseja importar?</label>
            <div className="module-selector">
              <button
                className={`module-btn ${importType === 'contacts' ? 'active' : ''}`}
                onClick={() => setImportType('contacts')}
              >
                <Users size={18} /> Empresas / Contatos
              </button>
              <button
                className={`module-btn ${importType === 'deals' ? 'active' : ''}`}
                onClick={() => setImportType('deals')}
              >
                <Briefcase size={18} /> Negociações
              </button>
            </div>
          </div>

          <div className="import-instructions">
            <h4>📋 Instruções de Importação</h4>
            <ul>
              <li>O arquivo deve ser <strong>.xlsx</strong> ou <strong>.csv</strong></li>
              <li>A primeira linha deve conter o <strong>cabeçalho das colunas</strong></li>
              {importType === 'contacts' && <>
                <li>Colunas esperadas: <code>Empresa</code>, <code>CNPJ/CPF</code>, <code>Cidade</code>, <code>UF</code>, <code>Telefone</code>, <code>E-mail</code>, <code>Segmento</code></li>
              </>}
              {importType === 'deals' && <>
                <li>Colunas esperadas: <code>Empresa</code>, <code>Produto</code>, <code>Valor</code></li>
                <li>As negociações serão criadas na etapa <strong>Lead Gerado</strong></li>
              </>}
            </ul>
            <button className="btn-template" onClick={downloadTemplate}>
              <FileDown size={14} /> Baixar Template de Exemplo
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />

          <button className="import-drop-btn" onClick={() => fileInputRef.current.click()}>
            <FileUp size={32} />
            <strong>Clique para selecionar o arquivo</strong>
            <span>Formatos aceitos: .xlsx, .xls, .csv</span>
          </button>

          {importResult && (
            <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
              {importResult.success ? (
                <><CheckCircle2 size={20} /> <strong>{importResult.count} registro(s)</strong> importado(s) com sucesso!</>
              ) : (
                <><AlertCircle size={20} /> <strong>Erro:</strong> {importResult.error}</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

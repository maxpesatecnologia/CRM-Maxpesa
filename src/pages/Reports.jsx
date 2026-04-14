import React, { useState, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileDown, FileUp, FileText, FileSpreadsheet, Table2,
  CheckCircle2, AlertCircle, Users, Briefcase, ListTodo, Truck, Globe,
  Cpu, Zap, Copy
} from 'lucide-react';
import './Reports.css';

const Reports = () => {
  const { deals, contacts, tasks, users, fleet, stages, bulkAddContacts, bulkAddDeals } = useCRM();
  const fileInputRef = useRef(null);

  const [importResult, setImportResult] = useState(null); // { success, count, error }
  const [isImporting, setIsImporting] = useState(false);
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
      headers: [
        'Empresa', 'Etapa', 'Motivo da Perda', 'Valor Único', 'Valor Recorrente', 
        'Data de Criação', 'Data de Fechamento', 'Fonte', 'Campanha', 'Vendedor', 'Produto'
      ],
      rows: () => deals.map(d => [
        d.empresa, 
        getStageTitle(d.etapaId),
        (d.motivoPerda || d.motivoperda || '-').toUpperCase(),
        formatCurrency(d.valorUnico),
        formatCurrency(d.valorRecorrente),
        d.dataCriacao || d.datacriacao || '-',
        d.dataFechamento || d.datafechamento || '-',
        d.fonte || '-',
        d.campanha || '-',
        d.vendedor || '-',
        d.produto || '-'
      ])
    },
    contacts: {
      label: 'Empresas / Contatos',
      icon: <Users size={18} />,
      headers: ['Empresa', 'CNPJ/CPF', 'Endereço', 'Cidade', 'UF', 'Telefone', 'Celular', 'E-mail', 'Segmento'],
      rows: () => contacts.map(c => [
        c.empresa, c.documento || '-',
        [c.endereco, c.bairro].filter(Boolean).join(', ') || '-',
        c.cidade || '-', c.uf || '-', c.telefone || '-', c.celular || '-', c.email || '-', c.segmento || '-'
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

  // ────────────────── EXPORTAR JSON (PARA IA) ──────────────────
  const exportJSON = () => {
    const cfg = exportConfigs[exportType];
    const rawData = {
      deals, contacts, tasks, users, fleet
    }[exportType];

    const dataToExport = {
      metadata: {
        sistema: "MAXPESA CRM",
        relatorio: cfg.label,
        dataGeracao: new Date().toLocaleString('pt-BR'),
        totalRegistros: rawData.length,
        versaoExportacao: "1.0-IA"
      },
      dados: rawData
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${exportType}_ia_${today()}.json`);
  };

  // ────────────────── COPIAR PROMPT PARA IA ──────────────────
  const copyAIPrompt = () => {
    const cfg = exportConfigs[exportType];
    const rawData = {
      deals, contacts, tasks, users, fleet
    }[exportType];
    
    // Pegamos uma amostra significativa, mas segura para o contexto da maioria das IAs
    const dataSample = rawData.slice(0, 50);
    
    const promptText = `
Atue como um Especialista em Análise de Dados e Consultor de Vendas.
Abaixo estão os dados reais do meu CRM (Módulo: ${cfg.label}) em formato JSON.

### CONTEXTO DOS DADOS:
- Sistema: MAXPESA CRM
- Total de registros na base: ${rawData.length}
- Amostra incluída neste prompt: ${dataSample.length} registros

### DADOS (JSON):
${JSON.stringify(dataSample, null, 2)}

### TAREFAS DE ANÁLISE:
1. Resuma o cenário atual destes dados em 3 pontos principais.
2. Identifique gargalos, tendências ou anomalias importantes.
3. Se houver valores financeiros, calcule o ticket médio e projeções.
4. Liste 5 recomendações práticas e imediatas para aumentar a eficiência.
5. Crie uma visualização em modo texto (tabela markdown) dos 5 itens mais críticos.

Por favor, forneça uma análise profunda e estratégica.
    `.trim();

    navigator.clipboard.writeText(promptText).then(() => {
      alert('Prompt estratégico copiado! Cole no seu Chat de IA (ChatGPT, Claude, Gemini) para uma análise instantânea.');
    });
  };

  // ────────────────── EXPORTAR HTML ──────────────────
  const exportHTML = () => {
    const cfg = exportConfigs[exportType];
    const rows = cfg.rows();
    const title = `Relatório — ${cfg.label}`;
    
    // Cálculo de totais para o resumo
    let totalUnico = 0;
    let totalRecorrente = 0;
    
    if (exportType === 'deals') {
      deals.forEach(d => {
        totalUnico += Number(d.valorUnico || 0);
        totalRecorrente += Number(d.valorRecorrente || 0);
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 40px; 
            color: #1e293b;
            background-color: #f8fafc;
          }
          
          .report-container {
            width: 100%;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            overflow-x: auto;
            box-sizing: border-box;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          .logo-area h1 {
            color: #ef4444;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }

          .logo-area p {
            color: #64748b;
            margin: 4px 0 0 0;
            font-size: 14px;
          }

          .date-area {
            text-align: right;
            color: #64748b;
            font-size: 13px;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .summary-card {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          .summary-card label {
            display: block;
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
          }

          .summary-card .value {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            min-width: 1500px;
          }

          th {
            background-color: #f1f5f9;
            color: #475569;
            text-align: left;
            padding: 12px 10px;
            font-weight: 600;
            border-bottom: 2px solid #e2e8f0;
          }

          td {
            padding: 10px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
          }

          tr:nth-child(even) { background-color: #fbfcfd; }
          
          .no-print {
            margin-bottom: 20px;
            text-align: right;
          }

          .btn-print {
            background: #ef4444;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }

          .btn-print:hover { background: #dc2626; }

          @media print {
            .no-print { display: none; }
            body { padding: 0; background: white; }
            .report-container { box-shadow: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
        </div>

        <div class="report-container">
          <div class="header">
            <div class="logo-area">
              <h1>MAXPESA CRM</h1>
              <p>${cfg.label}</p>
            </div>
            <div class="date-area">
              Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <label>Total de Registros</label>
              <div class="value">${rows.length}</div>
            </div>
            ${exportType === 'deals' ? `
              <div class="summary-card">
                <label>Valor Total Único</label>
                <div class="value">${formatCurrency(totalUnico)}</div>
              </div>
              <div class="summary-card">
                <label>Valor Total Recorrente</label>
                <div class="value">${formatCurrency(totalRecorrente)}</div>
              </div>
            ` : ''}
          </div>

          <table>
            <thead>
              <tr>${cfg.headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px;">
            Relatório gerado automaticamente pelo sistema MAXPESA CRM
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ────────────────── IMPORTAR ARQUIVO ──────────────────
  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!json.length) {
          setImportResult({ success: false, error: 'Arquivo vazio ou sem dados reconhecidos.' });
          setIsImporting(false);
          return;
        }

        let result;
        if (importType === 'contacts') {
          const contactsToImport = json.map(row => ({
            empresa: row['Empresa'] || row['empresa'] || row['EMPRESA'] || '',
            documento: row['CNPJ/CPF'] || row['documento'] || '',
            endereco: row['Endereço'] || row['endereco'] || '',
            cidade: row['Cidade'] || row['cidade'] || '',
            uf: row['UF'] || row['uf'] || '',
            telefone: row['Telefone'] || row['telefone'] || '',
            celular: row['Celular'] || row['celular'] || row['CELULAR'] || '',
            email: row['E-mail'] || row['email'] || '',
            segmento: row['Segmento'] || row['segmento'] || '',
            bairro: row['Bairro'] || row['bairro'] || '',
            cep: row['CEP'] || row['cep'] || '',
            contatos: row['Contato'] || row['contatos'] || ''
          }));
          result = await bulkAddContacts(contactsToImport);
        } else if (importType === 'deals') {
          const dealsToImport = json.map(row => ({
            empresa: row['Empresa'] || row['empresa'] || '',
            produto: row['Produto'] || row['produto'] || '',
            valorUnico: parseFloat(String(row['Valor'] || row['valor'] || '0').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
            etapaId: 'etapa-1'
          }));
          result = await bulkAddDeals(dealsToImport);
        }

        setImportResult(result);
      } catch (err) {
        console.error("Erro na leitura do arquivo:", err);
        setImportResult({ success: false, error: 'Erro ao ler o arquivo. Verifique o formato.' });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // ────────────────── BAIXAR TEMPLATE ──────────────────
  const downloadTemplate = () => {
    const templates = {
      contacts: [['Empresa', 'CNPJ/CPF', 'Endereço', 'Bairro', 'Cidade', 'UF', 'CEP', 'Telefone', 'Celular', 'Contato', 'E-mail', 'Segmento'],
                 ['Empresa Exemplo LTDA', '00.000.000/0001-00', 'Rua das Flores, 100', 'Centro', 'São Paulo', 'SP', '01000-000', '(11) 3000-0000', '(11) 90000-0000', 'João Silva', 'joao@exemplo.com', 'Indústria']],
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
            <button className="export-btn html" onClick={exportHTML}>
              <Globe size={18} /> Exportar HTML
            </button>
            <button className="export-btn ai-json" onClick={exportJSON}>
              <Cpu size={18} /> Exportar JSON (Para IA)
            </button>
            <button className="export-btn ai-prompt" onClick={copyAIPrompt}>
              <Zap size={18} /> Copiar para Chat IA
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
                <li>Colunas esperadas: <code>Empresa</code>, <code>CNPJ/CPF</code>, <code>Cidade</code>, <code>UF</code>, <code>Telefone</code>, <code>Celular</code>, <code>E-mail</code>, <code>Segmento</code></li>
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

          <button 
            className={`import-drop-btn ${isImporting ? 'disabled' : ''}`} 
            onClick={() => !isImporting && fileInputRef.current.click()}
            disabled={isImporting}
          >
            {isImporting ? (
              <div className="loader-spinner"></div>
            ) : (
              <FileUp size={32} />
            )}
            <strong>{isImporting ? 'Processando dados...' : 'Clique para selecionar o arquivo'}</strong>
            <span>{isImporting ? 'Isso pode levar alguns segundos' : 'Formatos aceitos: .xlsx, .xls, .csv'}</span>
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

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react';

// Mapeamento de nomes de coluna da planilha → campos do deal
const COLUMN_ALIASES = {
  empresa:         ['empresa', 'cliente', 'company', 'razao social', 'razão social'],
  nomeNegocacao:   ['negociacao', 'negociação', 'nome negociacao', 'nome negociação', 'titulo', 'título', 'nome', 'deal'],
  dataCriacao:     ['data criacao', 'data criação', 'datacriacao', 'data abertura', 'criacao', 'criação', 'data'],
  dataFechamento:  ['data fechamento', 'datafechamento', 'fechamento', 'data encerramento'],
  valorUnico:      ['valor unico', 'valor único', 'valorunico', 'valor', 'valor total'],
  valorRecorrente: ['valor recorrente', 'valorrecorrente', 'recorrente', 'mensalidade'],
  etapaId:         ['etapa', 'stage', 'funil', 'status', 'fase'],
  vendedor:        ['vendedor', 'responsavel', 'responsável', 'consultor', 'seller'],
  fonte:           ['fonte', 'origem', 'source'],
  campanha:        ['campanha', 'campaign'],
  produto:         ['produto', 'equipamento', 'product'],
  motivoPerda:     ['motivo perda', 'motivoperda', 'motivo', 'motivo de perda'],
};

// Mapeamento de nomes de etapa → IDs
const STAGE_MAP = {
  'lead gerado':         'etapa-1', 'lead':           'etapa-1',
  'lead qualificado':    'etapa-2', 'qualificado':    'etapa-2',
  'vistoria':            'etapa-3', 'vistoria tecnica': 'etapa-3',
  'proposta':            'etapa-4', 'proposta comercial': 'etapa-4',
  'pesquisa':            'etapa-5', 'pesquisa de preco': 'etapa-5',
  'negociacao':          'etapa-6', 'negociação':     'etapa-6',
  'perdemos':            'etapa-7', 'perdido':        'etapa-7', 'lost': 'etapa-7',
  'vencemos':            'etapa-8', 'ganho':          'etapa-8', 'won': 'etapa-8', 'fechado': 'etapa-8',
};

// Converte data do Excel para YYYY-MM-DD
const parseDate = (val) => {
  if (!val && val !== 0) return null;
  // Serial do Excel (número inteiro)
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (!s) return null;
  // DD/MM/YYYY ou DD-MM-YYYY
  const dmY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmY) {
    const [, d, m, y] = dmY;
    const year = y.length === 2 ? '20' + y : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
};

const parseMoney = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(s) || 0;
};

const detectColumn = (headers) => {
  const result = {};
  const lowerHeaders = headers.map(h => String(h || '').toLowerCase().trim());
  Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
    const idx = lowerHeaders.findIndex(h => aliases.some(a => h.includes(a)));
    if (idx !== -1) result[field] = headers[idx];
  });
  return result;
};

const rowToDeal = (row, mapping) => {
  const get = (field) => {
    const col = mapping[field];
    return col !== undefined ? row[col] : undefined;
  };

  const etapaRaw = String(get('etapaId') || '').toLowerCase().trim();
  const etapaId = STAGE_MAP[etapaRaw] || 'etapa-1';

  return {
    empresa:         String(get('empresa') || '').trim(),
    nomeNegocacao:   String(get('nomeNegocacao') || '').trim(),
    dataCriacao:     parseDate(get('dataCriacao')),
    dataFechamento:  parseDate(get('dataFechamento')),
    valorUnico:      parseMoney(get('valorUnico')),
    valorRecorrente: parseMoney(get('valorRecorrente')),
    etapaId,
    vendedor:        String(get('vendedor') || '').trim(),
    fonte:           String(get('fonte') || '').trim(),
    campanha:        String(get('campanha') || '').trim(),
    produto:         String(get('produto') || '').trim(),
    motivoPerda:     String(get('motivoPerda') || '').trim() || null,
  };
};

const FIELD_LABELS = {
  empresa: 'Empresa *', nomeNegocacao: 'Nome da Negociação',
  dataCriacao: 'Data de Criação', dataFechamento: 'Data de Fechamento',
  valorUnico: 'Valor Único (R$)', valorRecorrente: 'Valor Recorrente (R$)',
  etapaId: 'Etapa do Funil', vendedor: 'Vendedor',
  fonte: 'Fonte', campanha: 'Campanha', produto: 'Produto',
};

export default function ImportDeals({ onClose, onImport }) {
  const [step, setStep] = useState('upload'); // upload | mapping | preview | importing | done
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [deals, setDeals] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: [] });
  const fileRef = useRef();

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array', cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (data.length < 2) return alert('Planilha vazia ou sem dados.');
      const hdrs = data[0].map(h => String(h).trim()).filter(Boolean);
      const bodyRows = data.slice(1).filter(r => r.some(c => c !== ''));
      setHeaders(hdrs);
      setRows(bodyRows.map(r => Object.fromEntries(hdrs.map((h, i) => [h, r[i]]))));
      setMapping(detectColumn(hdrs));
      setStep('mapping');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBuildPreview = () => {
    const parsed = rows.map(r => rowToDeal(r, mapping)).filter(d => d.empresa);
    setDeals(parsed);
    setStep('preview');
  };

  const handleImport = async () => {
    setStep('importing');
    setProgress({ done: 0, total: deals.length, errors: [] });
    try {
      const result = await onImport(deals);
      if (result && result.success) {
        setProgress({ done: result.count, total: deals.length, errors: [] });
      } else {
        const msg = result?.error?.message || 'Erro desconhecido';
        setProgress({ done: 0, total: deals.length, errors: [{ empresa: 'Geral', msg }] });
      }
    } catch (err) {
      setProgress({ done: 0, total: deals.length, errors: [{ empresa: 'Geral', msg: err.message }] });
    }
    setStep('done');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} onClick={step !== 'importing' ? onClose : undefined} />
      <div style={{ position: 'relative', background: 'white', borderRadius: '16px', width: '100%', maxWidth: step === 'mapping' ? '720px' : '640px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', padding: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileSpreadsheet size={24} color="var(--primary-color)" />
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Importar Negócios da Planilha</h2>
          </div>
          {step !== 'importing' && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={22} />
            </button>
          )}
        </div>

        {/* STEP: Upload */}
        {step === 'upload' && (
          <div>
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '3rem', textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'border-color 0.2s' }}
            >
              <Upload size={40} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Clique ou arraste o arquivo .xlsx aqui</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Formatos aceitos: .xlsx, .xls, .csv</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            <div style={{ marginTop: '1.5rem', background: '#f0f9ff', borderRadius: '10px', padding: '1rem', fontSize: '0.85rem', color: '#0369a1' }}>
              <strong>Dica:</strong> A planilha deve ter cabeçalhos na primeira linha. Colunas esperadas: <em>Empresa, Data de Criação, Vendedor, Valor, Etapa</em> (os nomes não precisam ser exatos).
            </div>
          </div>
        )}

        {/* STEP: Mapeamento de colunas */}
        {step === 'mapping' && (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Detectamos <strong>{headers.length}</strong> colunas e <strong>{rows.length}</strong> registros. Confirme o mapeamento abaixo:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {Object.entries(FIELD_LABELS).map(([field, label]) => (
                <div key={field}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{label}</label>
                  <select
                    value={mapping[field] || ''}
                    onChange={e => setMapping(m => ({ ...m, [field]: e.target.value || undefined }))}
                    style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '7px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: mapping[field] ? '#f0fdf4' : 'white' }}
                  >
                    <option value="">(não importar)</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep('upload')} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer' }}>Voltar</button>
              <button onClick={handleBuildPreview} disabled={!mapping.empresa} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: '600', cursor: mapping.empresa ? 'pointer' : 'not-allowed', opacity: mapping.empresa ? 1 : 0.5 }}>
                Visualizar prévia →
              </button>
            </div>
          </div>
        )}

        {/* STEP: Preview */}
        {step === 'preview' && (
          <div>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <strong>{deals.length}</strong> negócios prontos para importar. Prévia dos primeiros 5:
            </p>
            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Empresa', 'Negociação', 'Data Criação', 'Etapa', 'Valor', 'Vendedor'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontWeight: '700' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deals.slice(0, 5).map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px' }}>{d.empresa}</td>
                      <td style={{ padding: '7px 10px' }}>{d.nomeNegocacao || '—'}</td>
                      <td style={{ padding: '7px 10px', color: d.dataCriacao ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: '600' }}>
                        {d.dataCriacao || '⚠ sem data'}
                      </td>
                      <td style={{ padding: '7px 10px' }}>{d.etapaId}</td>
                      <td style={{ padding: '7px 10px' }}>
                        {d.valorUnico > 0 ? `R$ ${d.valorUnico.toLocaleString('pt-BR')}` : '—'}
                      </td>
                      <td style={{ padding: '7px 10px' }}>{d.vendedor || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {deals.some(d => !d.dataCriacao) && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#92400e', marginBottom: '1rem' }}>
                ⚠️ {deals.filter(d => !d.dataCriacao).length} registro(s) sem data de criação — serão importados com a data de hoje.
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep('mapping')} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer' }}>Voltar</button>
              <button onClick={handleImport} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                Importar {deals.length} negócios
              </button>
            </div>
          </div>
        )}

        {/* STEP: Importando */}
        {step === 'importing' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Loader2 size={48} color="var(--primary-color)" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <h3>Importando negócios...</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>{progress.done} de {progress.total}</p>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', maxWidth: '400px', margin: '0 auto' }}>
              <div style={{ height: '100%', width: `${(progress.done / progress.total) * 100}%`, background: 'var(--primary-color)', transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* STEP: Concluído */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <CheckCircle size={52} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Importação concluída!</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              <strong>{progress.total - progress.errors.length}</strong> negócios importados com sucesso.
              {progress.errors.length > 0 && <span style={{ color: 'var(--danger-color)' }}> {progress.errors.length} com erro.</span>}
            </p>
            {progress.errors.length > 0 && (
              <div style={{ background: '#fff5f5', borderRadius: '8px', padding: '1rem', marginTop: '1rem', textAlign: 'left', fontSize: '0.82rem', color: 'var(--danger-color)', maxHeight: '150px', overflowY: 'auto' }}>
                {progress.errors.map((e, i) => <div key={i}>• {e.empresa}: {e.msg}</div>)}
              </div>
            )}
            <button onClick={onClose} style={{ marginTop: '1.5rem', padding: '0.7rem 2rem', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
              Fechar
            </button>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

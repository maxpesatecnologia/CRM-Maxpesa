import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, CheckCircle, Loader2, Download } from 'lucide-react';

// Mapeamento de nomes de coluna da planilha → campos da tarefa
const COLUMN_ALIASES = {
  empresa:         ['empresa', 'cliente', 'company', 'razao social', 'razão social'],
  negociacao:      ['negociacao', 'negociação', 'nome negociacao', 'nome negociação', 'deal', 'oportunidade'],
  assunto:         ['assunto', 'titulo', 'título', 'subject', 'task', 'tarefa', 'nome'],
  descricao:       ['descricao', 'descrição', 'description', 'detalhe', 'detalhes', 'observacao', 'observação', 'obs'],
  vendedor:        ['vendedor', 'responsavel', 'responsável', 'consultor', 'seller', 'usuario', 'usuário'],
  tipoTarefa:      ['tipo tarefa', 'tipo de tarefa', 'tipotarefa', 'tipo', 'type'],
  dataCriacao:     ['data criacao', 'data criação', 'datacriacao', 'data abertura', 'criacao', 'criação', 'data criada'],
  horaCriacao:     ['hora criacao', 'hora criação', 'horacriacao', 'hora criada', 'hora de criacao'],
  dataAgendamento: ['data agendamento', 'data agendada', 'agendamento', 'data prevista', 'data tarefa', 'prazo'],
  horario:         ['hora agendada', 'horario', 'horário', 'hora agendamento', 'hora'],
  status:          ['status', 'situacao', 'situação', 'state'],
  dataConclusao:   ['data conclusao', 'data conclusão', 'dataconclusao', 'data fechamento', 'conclusao', 'conclusão', 'data fim'],
  horaConclusao:   ['hora conclusao', 'hora conclusão', 'horaconclusao', 'hora fim', 'hora de conclusao'],
};

const FIELD_LABELS = {
  empresa:         'Empresa *',
  negociacao:      'Negociação',
  assunto:         'Assunto *',
  descricao:       'Descrição da Tarefa',
  vendedor:        'Responsável',
  tipoTarefa:      'Tipo de Tarefa',
  dataCriacao:     'Data de Criação',
  horaCriacao:     'Hora de Criação',
  dataAgendamento: 'Data Agendada',
  horario:         'Hora Agendada',
  status:          'Status',
  dataConclusao:   'Data da Conclusão',
  horaConclusao:   'Hora da Conclusão',
};

const TASK_TYPES = ['Ligação', 'E-mail', 'Visita', 'Reunião', 'Tarefa', 'Almoço', 'Whatsapp'];
const STATUS_OPTIONS = ['Pendente', 'Em andamento', 'Atrasada', 'Concluída'];

// Converte data do Excel para YYYY-MM-DD
const parseDate = (val) => {
  if (!val && val !== 0) return null;
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (!s) return null;
  const dmY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmY) {
    const [, d, m, y] = dmY;
    const year = y.length === 2 ? '20' + y : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
};

// Converte hora para HH:MM
const parseTime = (val) => {
  if (!val && val !== 0) return null;
  // Serial de hora do Excel (fração do dia)
  if (typeof val === 'number' && val < 1) {
    const totalMin = Math.round(val * 24 * 60);
    const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const m = (totalMin % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  const s = String(val).trim();
  if (!s) return null;
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  return null;
};

const normalizeStatus = (val) => {
  if (!val) return 'Pendente';
  const s = String(val).toLowerCase().trim();
  if (s.includes('conclu')) return 'Concluída';
  if (s.includes('andamento')) return 'Em andamento';
  if (s.includes('atras')) return 'Atrasada';
  return 'Pendente';
};

const normalizeTipoTarefa = (val) => {
  if (!val) return '';
  const s = String(val).toLowerCase().trim();
  if (s.includes('lig') || s.includes('phone')) return 'Ligação';
  if (s.includes('email') || s.includes('e-mail')) return 'E-mail';
  if (s.includes('visit')) return 'Visita';
  if (s.includes('reuni') || s.includes('meet')) return 'Reunião';
  if (s.includes('almo')) return 'Almoço';
  if (s.includes('whats') || s.includes('zap')) return 'Whatsapp';
  return TASK_TYPES.find(t => t.toLowerCase() === s) || String(val).trim();
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

const rowToTask = (row, mapping) => {
  const get = (field) => {
    const col = mapping[field];
    return col !== undefined ? row[col] : undefined;
  };

  const statusRaw = normalizeStatus(get('status'));

  return {
    empresa:         String(get('empresa') || '').trim(),
    negociacao:      String(get('negociacao') || '').trim(),
    assunto:         String(get('assunto') || '').trim(),
    descricao:       String(get('descricao') || '').trim(),
    vendedor:        String(get('vendedor') || '').trim(),
    tipoTarefa:      normalizeTipoTarefa(get('tipoTarefa')),
    dataCriacao:     parseDate(get('dataCriacao')),
    horaCriacao:     parseTime(get('horaCriacao')),
    dataAgendamento: parseDate(get('dataAgendamento')),
    horario:         parseTime(get('horario')),
    status:          statusRaw,
    concluida:       statusRaw === 'Concluída',
    dataConclusao:   parseDate(get('dataConclusao')),
    horaConclusao:   parseTime(get('horaConclusao')),
  };
};

// Gera planilha modelo para download
const downloadTemplate = () => {
  const headers = [
    'Empresa', 'Negociação', 'Assunto', 'Descrição da Tarefa',
    'Responsável', 'Tipo de Tarefa',
    'Data de Criação', 'Hora de Criação',
    'Data Agendada', 'Hora Agendada',
    'Status',
    'Data da Conclusão', 'Hora da Conclusão',
  ];
  const example = [
    'Empresa Exemplo Ltda', 'Proposta guindaste ABC', 'Ligar para o cliente',
    'Confirmar disponibilidade do equipamento', 'João Silva', 'Ligação',
    '16/06/2025', '09:00',
    '18/06/2025', '14:30',
    'Pendente',
    '', '',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tarefas');
  XLSX.writeFile(wb, 'modelo_importacao_tarefas.xlsx');
};

export default function ImportTasks({ onClose, onImport }) {
  const [step, setStep] = useState('upload');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [tasks, setTasks] = useState([]);
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
    const parsed = rows.map(r => rowToTask(r, mapping)).filter(t => t.empresa || t.assunto);
    setTasks(parsed);
    setStep('preview');
  };

  const handleImport = async () => {
    setStep('importing');
    setProgress({ done: 0, total: tasks.length, errors: [] });
    try {
      const result = await onImport(tasks);
      if (result && result.success) {
        setProgress({ done: result.count, total: tasks.length, errors: [] });
      } else {
        const msg = String(result?.error?.message || result?.error || 'Erro desconhecido');
        setProgress({ done: 0, total: tasks.length, errors: [{ empresa: 'Geral', msg }] });
      }
    } catch (err) {
      setProgress({ done: 0, total: tasks.length, errors: [{ empresa: 'Geral', msg: String(err?.message || err) }] });
    }
    setStep('done');
  };

  const statusColor = (s) => {
    if (s === 'Concluída') return '#10B981';
    if (s === 'Atrasada') return '#EF4444';
    if (s === 'Em andamento') return '#F59E0B';
    return '#64748B';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} onClick={step !== 'importing' ? onClose : undefined} />
      <div style={{
        position: 'relative', background: 'white', borderRadius: '16px',
        width: '100%', maxWidth: step === 'mapping' ? '800px' : '660px',
        maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)', padding: '2rem'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileSpreadsheet size={24} color="#00609C" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A' }}>Importar Tarefas da Planilha</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Suporta .xlsx, .xls e .csv</p>
            </div>
          </div>
          {step !== 'importing' && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
              <X size={22} />
            </button>
          )}
        </div>

        {/* Indicador de etapas */}
        {['upload', 'mapping', 'preview'].includes(step) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '2rem' }}>
            {['Upload', 'Mapeamento', 'Prévia'].map((label, i) => {
              const stepKeys = ['upload', 'mapping', 'preview'];
              const currentIdx = stepKeys.indexOf(step);
              const isActive = i === currentIdx;
              const isDone = i < currentIdx;
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? '#00609C' : isDone ? '#10B981' : '#E2E8F0',
                      color: isActive || isDone ? 'white' : '#94A3B8',
                      fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: isActive ? '700' : '500', color: isActive ? '#00609C' : '#64748B' }}>
                      {label}
                    </span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: isDone ? '#10B981' : '#E2E8F0', margin: '0 0.75rem' }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* STEP: Upload */}
        {step === 'upload' && (
          <div>
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              style={{
                border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '3rem',
                textAlign: 'center', cursor: 'pointer', background: '#FAFAFA',
                transition: 'border-color 0.2s, background 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00609C'; e.currentTarget.style.background = '#f0f9ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#FAFAFA'; }}
            >
              <Upload size={44} color="#00609C" style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: '700', marginBottom: '0.4rem', color: '#0F172A', fontSize: '1rem' }}>
                Clique ou arraste o arquivo aqui
              </p>
              <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>Formatos aceitos: .xlsx, .xls, .csv</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>

            <div style={{ marginTop: '1rem', background: '#f0f9ff', borderRadius: '10px', padding: '1rem', fontSize: '0.85rem', color: '#0369a1' }}>
              <strong>Colunas esperadas:</strong> Empresa, Negociação, Assunto, Descrição, Responsável, Tipo de Tarefa,
              Data de Criação, Hora de Criação, Data Agendada, Hora Agendada, Status, Data da Conclusão, Hora da Conclusão.
              <br />Os nomes não precisam ser exatos — o sistema detecta automaticamente.
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button
                onClick={downloadTemplate}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.2rem', borderRadius: '8px', border: '1px solid #00609C', background: 'white', color: '#00609C', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <Download size={16} /> Baixar planilha modelo
              </button>
            </div>
          </div>
        )}

        {/* STEP: Mapeamento */}
        {step === 'mapping' && (
          <div>
            <p style={{ color: '#64748B', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Detectamos <strong>{headers.length}</strong> colunas e <strong>{rows.length}</strong> registros.
              Confirme o mapeamento dos campos abaixo:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {Object.entries(FIELD_LABELS).map(([field, label]) => (
                <div key={field}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '3px' }}>{label}</label>
                  <select
                    value={mapping[field] || ''}
                    onChange={e => setMapping(m => ({ ...m, [field]: e.target.value || undefined }))}
                    style={{
                      width: '100%', padding: '0.45rem 0.75rem', borderRadius: '7px',
                      border: '1px solid #E2E8F0', fontSize: '0.85rem',
                      background: mapping[field] ? '#f0fdf4' : 'white',
                      outline: 'none'
                    }}
                  >
                    <option value="">(não importar)</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep('upload')} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontWeight: '600' }}>
                ← Voltar
              </button>
              <button
                onClick={handleBuildPreview}
                disabled={!mapping.empresa && !mapping.assunto}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: '#00609C', color: 'white', fontWeight: '700', cursor: 'pointer' }}
              >
                Visualizar prévia →
              </button>
            </div>
          </div>
        )}

        {/* STEP: Preview */}
        {step === 'preview' && (
          <div>
            <p style={{ marginBottom: '1rem', color: '#64748B', fontSize: '0.9rem' }}>
              <strong style={{ color: '#0F172A' }}>{tasks.length}</strong> tarefas prontas para importar. Prévia dos primeiros 5:
            </p>
            <div style={{ overflowX: 'auto', marginBottom: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Empresa', 'Assunto', 'Responsável', 'Tipo', 'Data Agendada', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0', fontWeight: '700', color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 5).map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: '600' }}>{t.empresa || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{t.assunto || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{t.vendedor || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{t.tipoTarefa || '—'}</td>
                      <td style={{ padding: '8px 12px', color: t.dataAgendamento ? '#10B981' : '#94A3B8', fontWeight: '600' }}>
                        {t.dataAgendamento || '—'}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', background: '#F1F5F9', color: statusColor(t.status) }}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tasks.some(t => !t.empresa) && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#92400e', marginBottom: '1rem' }}>
                ⚠️ {tasks.filter(t => !t.empresa).length} registro(s) sem empresa — serão importados assim mesmo.
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep('mapping')} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontWeight: '600' }}>
                ← Voltar
              </button>
              <button
                onClick={handleImport}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: '#00609C', color: 'white', fontWeight: '700', cursor: 'pointer' }}
              >
                Importar {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* STEP: Importando */}
        {step === 'importing' && (
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <Loader2 size={52} color="#00609C" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <h3 style={{ color: '#0F172A', marginBottom: '0.5rem' }}>Importando tarefas...</h3>
            <p style={{ color: '#64748B' }}>{progress.done} de {progress.total}</p>
          </div>
        )}

        {/* STEP: Concluído */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle size={56} color={progress.errors.length === 0 ? '#10B981' : '#F59E0B'} style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', color: '#0F172A' }}>Importação concluída!</h3>
            <p style={{ color: '#64748B', marginBottom: progress.errors.length ? '1rem' : 0 }}>
              <strong>{progress.total - progress.errors.length}</strong> tarefa(s) importada(s) com sucesso.
              {progress.errors.length > 0 && <span style={{ color: '#EF4444' }}> {progress.errors.length} com erro.</span>}
            </p>
            {progress.errors.length > 0 && (
              <div style={{ background: '#fff5f5', borderRadius: '8px', padding: '1rem', textAlign: 'left', fontSize: '0.82rem', color: '#EF4444', maxHeight: '140px', overflowY: 'auto' }}>
                {progress.errors.map((e, i) => <div key={i}>• {e.empresa || 'Linha'}: {String(e.msg ?? '')}</div>)}
              </div>
            )}
            <button
              onClick={onClose}
              style={{ marginTop: '1.5rem', padding: '0.7rem 2.5rem', borderRadius: '8px', border: 'none', background: '#00609C', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}
            >
              Fechar
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

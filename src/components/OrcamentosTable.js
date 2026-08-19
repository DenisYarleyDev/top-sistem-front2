import React, { useEffect, useState, useMemo, useRef } from 'react';
import colors from '../assets/styles/colors';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../assets/styles/colors';
import Modal from './Modal';
// Remover: import { FaBell } from 'react-icons/fa';
import { createAlertaOrcamento, getAlertasPorOrcamento, updateAlerta, deleteAlerta } from '../controllers/alertasController';
// Remover: import { Bell } from 'lucide-react';

function formatarTelefone(telefone) {
  if (!telefone) return '-';
  // Remove tudo que não for número
  const num = telefone.replace(/\D/g, '');
  if (num.length === 11) {
    return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`;
  } else if (num.length === 10) {
    return `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`;
  }
  return telefone;
}

function capitalizeWords(str) {
  return typeof str === 'string' ? str.replace(/\b\w/g, l => l.toUpperCase()) : str;
}

function parseDescontoOrcamentoPct(orc) {
  const d = Number(orc?.desconto);
  return Number.isFinite(d) && d >= 0 ? d : 0;
}

function totalBrutoOrcamento(orc) {
  const t = Number(orc?.totalOrcamento);
  return Number.isFinite(t) ? t : 0;
}

/** Valor à vista = total bruto menos % de desconto do orçamento (mesma lógica do modal de orçamento). */
function valorTotalAvista(orc) {
  const bruto = totalBrutoOrcamento(orc);
  const pct = parseDescontoOrcamentoPct(orc);
  const v = bruto * (1 - pct / 100);
  return Math.round(v * 100) / 100;
}

function OrcamentosTable({
  orcamentos,
  clientes,
  vendedores,
  onEditar,
  onExcluir,
  formatarReais,
  formatarDataBR
}) {
  const navigate = useNavigate();
  const [modalRecibo, setModalRecibo] = useState({ aberto: false, orcamentoId: null });
  const [tipoPagamento, setTipoPagamento] = useState('');
  const [entrada, setEntrada] = useState('');
  const [entradaTipo, setEntradaTipo] = useState('valor');
  const [dataEntrega, setDataEntrega] = useState('');
  const [vendas, setVendas] = useState([]);
  const [modalLembrete, setModalLembrete] = useState({ aberto: false, orcamentoId: null });
  const [lembreteObs, setLembreteObs] = useState('');
  const [lembreteData, setLembreteData] = useState('');
  const [lembretesOrcamento, setLembretesOrcamento] = useState({}); // { [orcamentoId]: [lembretes] }
  const [loadingLembretes, setLoadingLembretes] = useState(false);
  const [editandoLembrete, setEditandoLembrete] = useState(null); // { id, observacao, dataAlert }
  const [modalMsg, setModalMsg] = useState({ open: false, title: '', message: '', type: 'info', onConfirm: null });
  const [modalConfirm, setModalConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [modalFaturar, setModalFaturar] = useState({ aberto: false, orcamento: null, tipoPagamento: '' });

  const orcamentosRef = useRef(orcamentos);
  orcamentosRef.current = orcamentos;

  const orcamentoIdsKey = useMemo(
    () =>
      [...new Set(orcamentos.map((o) => o.id).filter((id) => id != null))]
        .sort((a, b) => Number(a) - Number(b))
        .join(','),
    [orcamentos]
  );

  const lastLembretesKeyFetched = useRef(null);

  useEffect(() => {
    async function fetchVendas() {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/vendas`);
        const data = await res.json();
        setVendas(Array.isArray(data) ? data : []);
      } catch {
        setVendas([]);
      }
    }
    fetchVendas();
  }, []);

  // Carregar lembretes por orçamento (GET /api/orcamentos/:id/alertas). Só refaz quando o conjunto de IDs muda;
  // useRef evita rajadas se o efeito for reagendado com a mesma chave (ex.: re-renders do pai).
  useEffect(() => {
    const idsKey = orcamentoIdsKey;
    const list = orcamentosRef.current;

    if (!list.length) {
      lastLembretesKeyFetched.current = null;
      setLembretesOrcamento({});
      return;
    }

    if (lastLembretesKeyFetched.current === idsKey) {
      return;
    }

    const ac = new AbortController();

    (async () => {
      setLoadingLembretes(true);
      const map = {};
      try {
        for (const orc of list) {
          if (ac.signal.aborted) return;
          try {
            const res = await getAlertasPorOrcamento(orc.id, { signal: ac.signal });
            map[orc.id] = res.success ? res.data : [];
          } catch (e) {
            if (e.name === 'AbortError' || ac.signal.aborted) return;
            map[orc.id] = [];
          }
        }
        if (!ac.signal.aborted) {
          lastLembretesKeyFetched.current = idsKey;
          setLembretesOrcamento(map);
        }
      } finally {
        if (!ac.signal.aborted) setLoadingLembretes(false);
      }
    })();

    return () => {
      ac.abort();
    };
  }, [orcamentoIdsKey]);

  function getVendaStatus(orcamentoId) {
    const venda = vendas.find(v => v.orcamento_id === orcamentoId);
    return venda ? venda.status : null;
  }

  function abrirModalRecibo(orcamentoId) {
    setModalRecibo({ aberto: true, orcamentoId });
    setTipoPagamento('');
    setEntrada('');
    setEntradaTipo('valor');
    setDataEntrega('');
  }

  function confirmarRecibo() {
    let url = `/recibo-venda/${modalRecibo.orcamentoId}?tipo=${tipoPagamento}`;
    if (tipoPagamento === 'avista') {
      url += `&entrada=${entrada}&entradaTipo=${entradaTipo}`;
    }
    url += `&dataEntrega=${encodeURIComponent(dataEntrega)}`;
    window.open(url, '_blank');
    setModalRecibo({ aberto: false, orcamentoId: null });
  }

  // Função para baixar PDF
  async function handleDownloadPDF(orcamentoId) {
    // Abre a página de impressão em nova aba
    window.open(`/orcamentos/print/${orcamentoId}`, '_blank');
  }

  async function handleSalvarLembrete() {
    if (!lembreteObs || !lembreteData) {
      setModalMsg({ open: true, title: 'Atenção', message: 'Preencha a observação e a data do lembrete!', type: 'warning', onConfirm: null });
      return;
    }
    try {
      let res;
      if (editandoLembrete) {
        res = await updateAlerta(editandoLembrete.id, { note: lembreteObs, dataAlert: lembreteData });
      } else {
        res = await createAlertaOrcamento(modalLembrete.orcamentoId, { note: lembreteObs, dataAlert: lembreteData });
      }
      if (res.success) {
        setModalMsg({ open: true, title: 'Sucesso', message: 'Lembrete salvo com sucesso!', type: 'success', onConfirm: null });
        setModalLembrete({ aberto: false, orcamentoId: null });
        setEditandoLembrete(null);
        setLembreteObs('');
        setLembreteData('');
        // Recarregar lembretes desse orçamento
        const r = await getAlertasPorOrcamento(modalLembrete.orcamentoId);
        setLembretesOrcamento(prev => ({ ...prev, [modalLembrete.orcamentoId]: r.success ? r.data : [] }));
      } else {
        setModalMsg({ open: true, title: 'Erro', message: 'Erro ao salvar lembrete: ' + res.message, type: 'error', onConfirm: null });
      }
    } catch (e) {
      setModalMsg({ open: true, title: 'Erro', message: 'Erro ao salvar lembrete: ' + e.message, type: 'error', onConfirm: null });
    }
  }

  async function handleExcluirLembrete(orcamentoId, lembreteId) {
    setModalConfirm({
      open: true,
      title: 'Confirmar Exclusão',
      message: 'Deseja excluir este lembrete?',
      onConfirm: async () => {
        try {
          const res = await deleteAlerta(lembreteId);
          if (res.success) {
            // Atualizar lista
            const r = await getAlertasPorOrcamento(orcamentoId);
            setLembretesOrcamento(prev => ({ ...prev, [orcamentoId]: r.success ? r.data : [] }));
          } else {
            setModalMsg({ open: true, title: 'Erro', message: 'Erro ao excluir lembrete: ' + res.message, type: 'error', onConfirm: null });
          }
        } catch (e) {
          setModalMsg({ open: true, title: 'Erro', message: 'Erro ao excluir lembrete: ' + e.message, type: 'error', onConfirm: null });
        }
      }
    });
  }

  function abrirEditarLembrete(orcamentoId, lembrete) {
    setModalLembrete({ aberto: true, orcamentoId });
    setEditandoLembrete(lembrete);
    setLembreteObs(lembrete.note || '');
    setLembreteData(lembrete.dataAlert ? lembrete.dataAlert.slice(0, 10) : '');
  }

  async function confirmarFaturamento() {
    const orc = modalFaturar.orcamento;
    const tipo = modalFaturar.tipoPagamento;
    if (!orc || (tipo !== 'avista' && tipo !== 'parcelado')) {
      setModalMsg({ open: true, title: 'Atenção', message: 'Selecione se o pagamento é à vista ou parcelado.', type: 'warning', onConfirm: null });
      return;
    }
    const descontoPct = parseDescontoOrcamentoPct(orc);
    const bruto = totalBrutoOrcamento(orc);
    const valorTotal = tipo === 'avista' ? valorTotalAvista(orc) : bruto;
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/vendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orcamento_id: orc.id,
          tipo_pagamento: tipo,
          desconto_aplicado: descontoPct,
          valor_total: valorTotal
        })
      });
      if (!res.ok) {
        let errMsg = res.statusText;
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {}
        setModalMsg({ open: true, title: 'Erro', message: 'Erro ao faturar: ' + errMsg, type: 'error', onConfirm: null });
        return;
      }
      setModalFaturar({ aberto: false, orcamento: null, tipoPagamento: '' });
      setModalMsg({ open: true, title: 'Sucesso', message: 'Orçamento faturado com sucesso!', type: 'success', onConfirm: null });
      window.location.reload();
    } catch (e) {
      setModalMsg({ open: true, title: 'Erro', message: 'Erro ao faturar: ' + e.message, type: 'error', onConfirm: null });
    }
  }

  return (
    <div style={{ marginBottom: 32, border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: colors.surface }}>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>ID</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Cliente</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Contato</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Vendedor</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Total</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Data de Emissão</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {orcamentos.length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 20 }}>Nenhum orçamento cadastrado</td></tr>
          )}
          {orcamentos.map(orc => {
            const clienteObj = clientes.find(c => c.id === orc.clienteFK || c.id === Number(orc.clienteFK));
            const vendedorObj = vendedores.find(v => v.id === orc.vendedorFK || v.id === Number(orc.vendedorFK));
            return (
              <tr key={orc.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 10 }}>{orc.id}</td>
                <td style={{ padding: 10 }}>{clienteObj ? capitalizeWords(clienteObj.nome) : `ID ${orc.clienteFK}`}</td>
                <td style={{ padding: 10 }}>{clienteObj && clienteObj.telefone ? formatarTelefone(clienteObj.telefone) : '-'}</td>
                <td style={{ padding: 10 }}>{vendedorObj ? capitalizeWords(vendedorObj.nome) : `ID ${orc.vendedorFK}`}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>{formatarReais(orc.totalOrcamento)}</td>
                <td style={{ padding: 10 }}>{formatarDataBR(orc.data).split(' ')[0]}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  <button style={{ marginRight: 8, color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }} onClick={() => onEditar(orc)}>Editar</button>
                  <button style={{ marginRight: 8, color: colors.error, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }} onClick={() => onExcluir(orc.id)}>Excluir</button>
                  <button style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }} onClick={() => window.open(`/orcamentos/print/${orc.id}`, '_blank')}>Imprimir</button>
                  {(() => {
                    const vendaStatus = getVendaStatus(orc.id);
                    if (vendaStatus === 'cancelada') {
                      return (
                        <button
                          style={{ marginRight: 8, color: '#fff', background: '#dc3545', border: 'none', borderRadius: 4, padding: '4px 10px', fontWeight: 500, cursor: 'not-allowed', opacity: 0.7 }}
                          disabled
                        >
                          Cancelado
                        </button>
                      );
                    } else if (vendaStatus === 'faturada') {
                      return (
                        <button
                          style={{ marginRight: 8, color: '#fff', background: '#bdbdbd', border: 'none', borderRadius: 4, padding: '4px 10px', fontWeight: 500, cursor: 'not-allowed', opacity: 0.7 }}
                          disabled
                        >
                          Faturado
                        </button>
                      );
                    } else {
                      return (
                        <button
                          style={{ marginRight: 8, color: colors.primary, background: 'none', border: '1px solid #10b981', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontWeight: 500 }}
                          onClick={() => setModalFaturar({ aberto: true, orcamento: orc, tipoPagamento: '' })}
                        >
                          Faturar
                        </button>
                      );
                    }
                  })()}
                  {/* Botão Gerar Recibo de Venda só habilitado se houver venda faturada */}
                  <button
                    style={{ color: colors.primary, background: 'none', border: 'none', cursor: getVendaStatus(orc.id) === 'faturada' ? 'pointer' : 'not-allowed', fontWeight: 500, opacity: getVendaStatus(orc.id) === 'faturada' ? 1 : 0.5 }}
                    onClick={() => {
                      if (getVendaStatus(orc.id) === 'faturada') {
                        abrirModalRecibo(orc.id);
                      } else {
                        setModalMsg({ open: true, title: 'Atenção', message: 'Para gerar recibo de venda, a venda precisa estar faturada.', type: 'warning', onConfirm: null });
                      }
                    }}
                    disabled={getVendaStatus(orc.id) !== 'faturada'}
                  >
                    Gerar Recibo de Venda
                  </button>
                  <button
                    style={{ marginLeft: 8, color: '#f59e42', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    title="Adicionar Lembrete"
                    onClick={() => {
                      setModalLembrete({ aberto: true, orcamentoId: orc.id });
                      setEditandoLembrete(null);
                      setLembreteObs('');
                      setLembreteData('');
                    }}
                  >
                    <span style={{ marginRight: 4 }}>🔔</span> Lembrete
                  </button>
                  {/* Listar lembretes desse orçamento */}
                  <div style={{ marginTop: 6 }}>
                    {(lembretesOrcamento[orc.id] || []).map(lembrete => (
                      <div key={lembrete.id} style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 4, padding: 4, marginBottom: 4, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>
                          <b>{lembrete.dataAlert ? new Date(lembrete.dataAlert).toLocaleDateString('pt-BR') : ''}</b>: {lembrete.note}
                        </span>
                        <span>
                          <button style={{ color: '#f59e42', background: 'none', border: 'none', marginLeft: 8, cursor: 'pointer' }} title="Editar" onClick={() => abrirEditarLembrete(orc.id, lembrete)}>Editar</button>
                          <button style={{ color: '#ef4444', background: 'none', border: 'none', marginLeft: 4, cursor: 'pointer' }} title="Excluir" onClick={() => handleExcluirLembrete(orc.id, lembrete.id)}>Excluir</button>
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Modal
        isOpen={modalRecibo.aberto}
        onClose={() => setModalRecibo({ aberto: false, orcamentoId: null })}
        title="Tipo de Pagamento"
        message={
          <div>
            <div style={{ marginBottom: 12 }}>
              <label>
                <input type="radio" name="tipoPagamento" value="parcelado" checked={tipoPagamento === 'parcelado'} onChange={() => setTipoPagamento('parcelado')} /> Parcelado
              </label>
              <label style={{ marginLeft: 24 }}>
                <input type="radio" name="tipoPagamento" value="avista" checked={tipoPagamento === 'avista'} onChange={() => setTipoPagamento('avista')} /> À vista
              </label>
            </div>
            {tipoPagamento === 'avista' && (
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 6 }}>Valor de entrada:</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" min="0" placeholder="Valor ou %" value={entrada} onChange={e => setEntrada(e.target.value)} style={{ width: 100, padding: 4 }} />
                  <select value={entradaTipo} onChange={e => setEntradaTipo(e.target.value)}>
                    <option value="valor">R$</option>
                    <option value="porcentagem">%</option>
                  </select>
                </div>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 500 }}>Data de Entrega <span style={{ color: 'red' }}>*</span></label><br />
              <input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }} required />
            </div>
          </div>
        }
        type="info"
        confirmText="Gerar Recibo"
        cancelText="Cancelar"
        showCancel={true}
        onConfirm={tipoPagamento && dataEntrega ? confirmarRecibo : null}
      />
      {/* Modal de Lembrete */}
      <Modal
        isOpen={modalLembrete.aberto}
        onClose={() => { setModalLembrete({ aberto: false, orcamentoId: null }); setEditandoLembrete(null); }}
        title={editandoLembrete ? "Editar Lembrete" : "Adicionar Lembrete"}
        message={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label>Observação</label>
              <textarea value={lembreteObs} onChange={e => setLembreteObs(e.target.value)} rows={3} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            </div>
            <div>
              <label>Data do Lembrete</label>
              <input type="date" value={lembreteData} onChange={e => setLembreteData(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            </div>
          </div>
        }
        type="info"
        confirmText={editandoLembrete ? "Salvar Alterações" : "Salvar"}
        cancelText="Cancelar"
        showCancel={true}
        onConfirm={handleSalvarLembrete}
      />
      <Modal
        isOpen={modalMsg.open}
        onClose={() => setModalMsg({ ...modalMsg, open: false })}
        title={modalMsg.title}
        message={modalMsg.message}
        type={modalMsg.type}
        showCancel={false}
        confirmText="OK"
        onConfirm={modalMsg.onConfirm}
      />
      <Modal
        isOpen={modalConfirm.open}
        onClose={() => setModalConfirm({ ...modalConfirm, open: false })}
        title={modalConfirm.title}
        message={modalConfirm.message}
        type="warning"
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={modalConfirm.onConfirm}
      />
      <Modal
        isOpen={modalFaturar.aberto}
        onClose={() => setModalFaturar({ aberto: false, orcamento: null, tipoPagamento: '' })}
        title="Faturar orçamento"
        message={
          modalFaturar.orcamento ? (
            <div style={{ textAlign: 'left' }}>
              <p style={{ marginBottom: 12 }}>
                Orçamento <b>#{modalFaturar.orcamento.id}</b> — total (sem desconto):{' '}
                <b>{formatarReais(totalBrutoOrcamento(modalFaturar.orcamento))}</b>
                {parseDescontoOrcamentoPct(modalFaturar.orcamento) > 0 && (
                  <> · desconto do orçamento: <b>{parseDescontoOrcamentoPct(modalFaturar.orcamento)}%</b></>
                )}
              </p>
              <p style={{ marginBottom: 8, fontWeight: 600 }}>Forma de pagamento na venda:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tipoFaturar"
                    checked={modalFaturar.tipoPagamento === 'parcelado'}
                    onChange={() => setModalFaturar((m) => ({ ...m, tipoPagamento: 'parcelado' }))}
                  />{' '}
                  Parcelado — valor na venda: <b>{formatarReais(totalBrutoOrcamento(modalFaturar.orcamento))}</b> (total do orçamento)
                </label>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tipoFaturar"
                    checked={modalFaturar.tipoPagamento === 'avista'}
                    onChange={() => setModalFaturar((m) => ({ ...m, tipoPagamento: 'avista' }))}
                  />{' '}
                  À vista — valor na venda: <b>{formatarReais(valorTotalAvista(modalFaturar.orcamento))}</b> (com desconto)
                </label>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Serão enviados: <code style={{ fontSize: 11 }}>tipo_pagamento</code> (avista ou parcelado),{' '}
                <code style={{ fontSize: 11 }}>desconto_aplicado</code> (% do orçamento) e{' '}
                <code style={{ fontSize: 11 }}>valor_total</code>.
              </p>
            </div>
          ) : null
        }
        type="info"
        confirmText="Confirmar faturamento"
        cancelText="Cancelar"
        showCancel
        onConfirm={modalFaturar.tipoPagamento ? confirmarFaturamento : null}
      />
    </div>
  );
}

export default OrcamentosTable; 
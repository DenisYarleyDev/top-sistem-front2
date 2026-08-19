import React from 'react';

const DADOS_LOJA = {
  nome: 'Top Alumínio e Vidraçaria',
  cnpj: '46252787000180',
  endereco: 'Av. José dos Santos e Silva, 1205A - Centro (Sul) - Teresina, Piauí',
  contato: '86981782681',
};

function formatarTelefone(telefone) {
  if (!telefone) return '-';
  const num = telefone.replace(/\D/g, '');
  if (num.length === 11) {
    return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`;
  } else if (num.length === 10) {
    return `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`;
  }
  return telefone;
}

function formatarCNPJ(cnpj) {
  if (!cnpj) return '-';
  const num = cnpj.replace(/\D/g, '');
  if (num.length === 14) {
    return `${num.slice(0, 2)}.${num.slice(2, 5)}.${num.slice(5, 8)}/${num.slice(8, 12)}-${num.slice(12)}`;
  }
  return cnpj;
}

function formatarCPF(cpf) {
  if (!cpf) return '-';
  const num = cpf.replace(/\D/g, '');
  if (num.length === 11) {
    return `${num.slice(0, 3)}.${num.slice(3, 6)}.${num.slice(6, 9)}-${num.slice(9)}`;
  }
  return cpf;
}

function formatarReais(valor) {
  if (valor == null || valor === '') return '-';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function identificarCpfCnpj(doc) {
  if (!doc) return '-';
  const num = doc.replace(/\D/g, '');
  if (num.length === 11) return formatarCPF(num);
  if (num.length === 14) return formatarCNPJ(num);
  return doc;
}

function formatMedida(valor, sufixo = 'm') {
  if (valor === undefined || valor === null || Number.isNaN(Number(valor))) return '-';
  return `${Number(valor).toFixed(2).replace('.', ',')} ${sufixo}`;
}

const card = {
  background: '#f9fafb',
  borderRadius: 10,
  padding: 12,
  marginBottom: 12,
  border: '1px solid #e5e7eb',
};

const label = { fontWeight: 600, color: '#10b981', fontSize: 13, marginBottom: 6 };

/**
 * Layout alternativo para telas com largura inferior a 500px (mesmos dados do recibo desktop).
 */
export default function ReciboVendaPrintMobile({
  reciboRef,
  menuOpen,
  setMenuOpen,
  handleDownloadPDF,
  orcamento,
  itens,
  produtos,
  cliente,
  vendedor,
  tipoPagamento,
  dataEntrega,
  formatarDataEntrega,
  total,
  nParcelas,
  valorParcela,
  valorDesconto,
  valorVista,
  valorEntrada,
  saldoRestante,
}) {
  const wrap = {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '12px 14px 24px',
    background: '#fff',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    color: '#222',
    position: 'relative',
    boxSizing: 'border-box',
    WebkitTextSizeAdjust: '100%',
  };

  const row = (k, v) => (
    <div key={k} style={{ fontSize: 13, marginBottom: 4, lineHeight: 1.35 }}>
      <b>{k}:</b> {v}
    </div>
  );

  return (
    <div ref={reciboRef} style={wrap}>
      <div className="no-print" style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <button
          type="button"
          onClick={() => setMenuOpen((m) => !m)}
          style={{
            background: 'none',
            border: 'none',
            color: '#10b981',
            fontSize: 24,
            cursor: 'pointer',
            opacity: 0.55,
            padding: 4,
            borderRadius: 6,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Mais opções"
        >
          &#8942;
        </button>
        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 40,
              right: 0,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              minWidth: 140,
              padding: '4px 0',
              zIndex: 20,
            }}
          >
            <button
              type="button"
              onClick={handleDownloadPDF}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#222',
                fontSize: 15,
                padding: '10px 16px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              Baixar PDF
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, letterSpacing: 1, color: '#10b981', marginBottom: 14, paddingTop: 4 }}>
        RECIBO DE COMPRA
      </div>

      <div style={{ ...card, borderBottom: '2px solid #10b981', textAlign: 'center' }}>
        <img src="/logo-top.jpg" alt="Logo" style={{ height: 48, marginBottom: 10 }} />
        <div style={{ fontSize: 17, fontWeight: 700, color: '#10b981', lineHeight: 1.25 }}>{DADOS_LOJA.nome}</div>
        <div style={{ fontSize: 12, color: '#444', marginTop: 6 }}>CNPJ: {formatarCNPJ(DADOS_LOJA.cnpj)}</div>
        <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>{DADOS_LOJA.endereco}</div>
        <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>Contato: {formatarTelefone(DADOS_LOJA.contato)}</div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>Recibo #{orcamento.id}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            {orcamento.data ? new Date(orcamento.data).toLocaleDateString('pt-BR') : ''}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={label}>Cliente</div>
        {row('Nome', cliente?.nome || '-')}
        {row('Telefone', formatarTelefone(cliente?.telefone))}
        {row(
          'Endereço',
          `${cliente?.rua || '-'}${cliente?.numero ? ', ' + cliente.numero : ''}${cliente?.bairro ? ' - ' + cliente.bairro : ''}${cliente?.cidade ? ' - ' + cliente.cidade : ''}`
        )}
        {row('CPF/CNPJ', identificarCpfCnpj(cliente?.cpfoucnpj))}
      </div>

      <div style={card}>
        <div style={label}>Vendedor</div>
        {row('Nome', vendedor?.nome || '-')}
        {row('Telefone', formatarTelefone(vendedor?.numero))}
        {row('ID', vendedor?.id ?? '-')}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ ...label, fontSize: 15, marginBottom: 10 }}>Produtos</div>
        {itens.map((item, idx) => {
          const prod = produtos.find((p) => p.id === item.produtoFK || p.id === Number(item.produtoFK));
          const preco = prod ? Number(prod.preco) : 0;
          const area = Number(item.area) || 0;
          const quantidade = Number(item.quantidade) || 0;
          const valorUnitario = prod && prod.medida ? preco * area : preco;
          const subtotal = valorUnitario * quantidade;
          return (
            <div key={idx} style={{ ...card, marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#111' }}>{prod ? prod.nome : '-'}</div>
              {row('Qtd', String(item.quantidade))}
              {row('Valor', prod && prod.medida ? `${formatarReais(preco)} / m²` : formatarReais(preco))}
              {prod && prod.medida ? (
                <>
                  {row('Largura', formatMedida(item.largura))}
                  {row('Altura', formatMedida(item.altura))}
                  {row('Área', formatMedida(item.area, 'm²'))}
                </>
              ) : null}
              {row('Valor unitário', formatarReais(valorUnitario))}
              {row('Subtotal', formatarReais(subtotal))}
              {row('Medida', prod && prod.medida ? 'Sim' : 'Não')}
            </div>
          );
        })}
      </div>

      {tipoPagamento === 'parcelado' ? (
        <div
          style={{
            background: '#f6fff8',
            border: '1px solid #c3e6cb',
            borderRadius: 10,
            padding: 14,
            marginBottom: 14,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 700, color: '#10b981', marginBottom: 8 }}>Compra parcelada</div>
          <div style={{ marginBottom: 4 }}>
            <b>Total parcelado:</b> R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ color: '#555' }}>
            {nParcelas}x de R$ {valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      ) : tipoPagamento === 'avista' ? (
        <div
          style={{
            background: '#f6fff8',
            border: '1px solid #c3e6cb',
            borderRadius: 10,
            padding: 14,
            marginBottom: 14,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 700, color: '#10b981', marginBottom: 8 }}>Compra à vista</div>
          <div style={{ marginBottom: 6 }}>
            <b>Entrada paga:</b> <span style={{ color: '#059669', fontWeight: 600 }}>{formatarReais(valorEntrada)}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <b>Saldo restante:</b> <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatarReais(saldoRestante)}</span>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 8, lineHeight: 1.45 }}>
            Total: {formatarReais(total)} · Desconto: {formatarReais(valorDesconto)} · À vista: {formatarReais(valorVista)}
          </div>
        </div>
      ) : null}

      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={label}>Data de entrega</div>
        <div style={{ borderBottom: '1px solid #222', fontSize: 16, letterSpacing: 3, color: '#555', paddingBottom: 4 }}>
          {formatarDataEntrega(dataEntrega)}
        </div>
      </div>

      <div style={{ marginTop: 28, marginBottom: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ borderBottom: '1px solid #222', maxWidth: '100%', height: 26, margin: '0 auto' }} />
          <div style={{ marginTop: 8, color: '#444', fontSize: 13 }}>Assinatura do Cliente</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #222', maxWidth: '100%', height: 26, margin: '0 auto' }} />
          <div style={{ marginTop: 8, color: '#444', fontSize: 13 }}>Assinatura do Vendedor</div>
        </div>
      </div>

      <footer
        style={{
          marginTop: 24,
          paddingTop: 10,
          borderTop: '1px solid #e5e7eb',
          color: '#888',
          fontSize: 10,
          textAlign: 'center',
          opacity: 0.85,
        }}
      >
        Desenvolvido por <b>ftdsolutions</b>
      </footer>
    </div>
  );
}

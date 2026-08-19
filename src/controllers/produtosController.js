import { API_CONFIG } from '../assets/styles/colors';

const PAGE_SIZE = 1000;

function normalizeProdutosPayload(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.produtos)) return data.produtos;
  return [];
}

/** Considera inativo apenas false/0/'false'/'0'; demais casos tratamos como ativo (compat. com APIs antigas). */
export function isProdutoAtivo(p) {
  if (!p || p.ativo === undefined || p.ativo === null) return true;
  const v = p.ativo;
  return v !== false && v !== 0 && v !== '0' && v !== 'false' && v !== 'False';
}

async function fetchProdutosOnce(searchParams) {
  const qs = searchParams.toString();
  const path = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.LIST}${qs ? `?${qs}` : ''}`;
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { ok: false, error: errorData.error || 'Erro ao buscar produtos' };
  }

  const data = await response.json();
  return { ok: true, list: normalizeProdutosPayload(data) };
}

/**
 * Busca produtos. Por padrão acumula páginas de até PAGE_SIZE itens (limit/offset)
 * para contornar o limite típico de 1000 registros no backend.
 * @param {object|string} [options] - Objeto de opções ou string `nome` (atalho)
 * @param {string} [options.nome] - Filtro por nome (query `nome`), se o backend suportar
 * @param {boolean} [options.somenteAtivos] - Se true, envia `ativo=true` na query e descarta inativos na resposta
 */
export const getProdutos = async (options = {}) => {
  try {
    const opts = typeof options === 'string' ? { nome: options } : options || {};
    const nome = (opts.nome || opts.search || '').trim();
    const somenteAtivos = Boolean(opts.somenteAtivos);

    const params = new URLSearchParams();
    if (nome) params.set('nome', nome);
    if (somenteAtivos) params.set('ativo', 'true');

    const result = await fetchProdutosOnce(params);
    if (!result.ok) {
      return { success: false, message: result.error };
    }

    const batch = result.list;
    const all = somenteAtivos ? batch.filter((p) => p && isProdutoAtivo(p)) : batch.filter(Boolean);

    return { success: true, data: all };
  } catch (error) {
    return { success: false, message: 'Erro de conexão ao buscar produtos' };
  }
};

// Buscar produto por ID
export const getProdutoById = async (id) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.GET(id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Erro ao buscar produto' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, message: 'Erro de conexão ao buscar produto' };
  }
};

// Criar novo produto
export const createProduto = async (produtoData) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.CREATE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(produtoData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Erro ao criar produto' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, message: 'Erro de conexão ao criar produto' };
  }
};

// Atualizar produto
export const updateProduto = async (id, produtoData) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.UPDATE(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(produtoData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Erro ao atualizar produto' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, message: 'Erro de conexão ao atualizar produto' };
  }
};

// Deletar produto
export const deleteProduto = async (id) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.DELETE(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Erro ao deletar produto' };
    }

    return { success: true, message: 'Produto excluído com sucesso' };
  } catch (error) {
    return { success: false, message: 'Erro de conexão ao deletar produto' };
  }
}; 
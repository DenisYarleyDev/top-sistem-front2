import { API_CONFIG } from '../assets/styles/colors';

export const getVendedores = async () => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENDEDORES.LIST}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Erro ao buscar vendedores' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, message: 'Erro de conexão ao buscar vendedores' };
  }
};

export const createVendedor = async (vendedorData) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENDEDORES.CREATE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(vendedorData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Erro ao criar vendedor' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, message: 'Erro de conexão ao criar vendedor' };
  }
};

export const updateVendedor = async (id, vendedorData) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENDEDORES.UPDATE(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(vendedorData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Erro ao atualizar vendedor' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, message: 'Erro de conexão ao atualizar vendedor' };
  }
};

export const deleteVendedor = async (id) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENDEDORES.DELETE(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Erro ao deletar vendedor' };
    }

    const data = await response.json();
    return { 
      success: true, 
      data,
      message: `Vendedor excluído com sucesso${data.orcamentosExcluidos > 0 ? `. ${data.orcamentosExcluidos} orçamento(s) relacionado(s) também foi(foram) excluído(s).` : ''}`
    };
  } catch (error) {
    return { success: false, message: 'Erro de conexão ao deletar vendedor' };
  }
};

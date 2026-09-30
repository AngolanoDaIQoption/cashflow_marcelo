import type { IContaBancaria } from '../types';

const API_BASE_URL = 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('kamikase_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const ContaBancariaService = {
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/api/contas`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.erro || 'Falha ao listar contas bancárias.');
    }

    return response.json();
  },

  criar: async (conta: Omit<IContaBancaria, 'id' | 'usuario_id'>) => {
    const response = await fetch(`${API_BASE_URL}/api/contas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(conta),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.erro || 'Falha ao criar conta bancária.');
    }

    return response.json();
  },

  atualizar: async (id: number, conta: Partial<IContaBancaria>) => {
    const response = await fetch(`${API_BASE_URL}/api/contas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(conta),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.erro || 'Falha ao atualizar conta bancária.');
    }

    return response.json();
  },

  deletar: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/contas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.erro || 'Falha ao excluir conta bancária.');
    }

    return response.json();
  },

  extrato: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/contas/${id}/extrato`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.erro || 'Falha ao carregar extrato da conta.');
    }

    return response.json();
  },
};
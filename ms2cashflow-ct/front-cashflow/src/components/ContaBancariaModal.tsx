import React, { useState } from 'react';
import { ContaBancariaService } from '../services/contaBancariaService';
import type { TipoContaBancaria } from '../types';

interface ContaBancariaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Gatilho para recarregar a lista na página principal
}

export const ContaBancariaModal: React.FC<ContaBancariaModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [nome, setNome] = useState('');
  const [banco, setBanco] = useState('');
  const [tipo, setTipo] = useState<TipoContaBancaria>('corrente');
  const [saldoInicial, setSaldoInicial] = useState<number | string>('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      await ContaBancariaService.criar({
        nome,
        banco,
        tipo,
        saldo_inicial: Number(saldoInicial) || 0,
      });
      
      // Limpa o formulário e fecha o modal
      setNome('');
      setBanco('');
      setTipo('corrente');
      setSaldoInicial('');
      onSuccess(); 
      onClose();
    } catch (err: any) {
      console.error(err);
      setErro(err.response?.data?.erro || 'Erro ao criar conta bancária.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-bold text-gray-800 mb-6">Nova Conta Bancária</h2>

        {erro && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{erro}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Conta (ex: Conta Principal)
            </label>
            <input 
              type="text" 
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Nubank, Carteira"
              className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banco Instituição (ex: Nubank, Caixa)
            </label>
            <input 
              type="text" 
              required
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Ex: Itaú, Bradesco"
              className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Conta
              </label>
              <select 
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoContaBancaria)}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="corrente" className="text-gray-900">Corrente</option>
                <option value="poupanca" className="text-gray-900">Poupança</option>
                <option value="incash" className="text-gray-900">Dinheiro Físico</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saldo Inicial
              </label>
              <input 
                type="number" 
                step="0.01"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'A guardar...' : 'Salvar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
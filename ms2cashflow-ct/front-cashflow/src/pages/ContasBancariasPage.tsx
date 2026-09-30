import React, { useEffect, useMemo, useState } from 'react';
import { ContaBancariaModal } from '../components/ContaBancariaModal';
import { ContaBancariaService } from '../services/contaBancariaService';
import type { IContaBancaria } from '../types';

export const ContasBancariasPage: React.FC = () => {
  const [contas, setContas] = useState<IContaBancaria[]>([]);
  const [saldoTotal, setSaldoTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<IContaBancaria | null>(null);
  const [extrato, setExtrato] = useState<any>(null);
  const [loadingExtrato, setLoadingExtrato] = useState(false);

  const carregarContas = async () => {
    try {
      setLoading(true);
      setError(null);

      const resposta = await ContaBancariaService.listar();
      setContas(resposta.contas || []);
      setSaldoTotal(Number(resposta.saldoTotalConsolidado ?? 0));
    } catch (err: any) {
      console.error('Erro ao carregar contas bancárias:', err);
      setError(err.message || 'Não foi possível carregar as contas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarContas();
  }, []);

  const resumo = useMemo(() => {
    const emBanco = contas
      .filter((conta) => conta.tipo !== 'incash')
      .reduce((total, conta) => total + Number(conta.saldo_atual ?? 0), 0);

    const emEspecie = contas
      .filter((conta) => conta.tipo === 'incash')
      .reduce((total, conta) => total + Number(conta.saldo_atual ?? 0), 0);

    return {
      totalContas: contas.length,
      emBanco,
      emEspecie,
      consolidado: saldoTotal,
    };
  }, [contas, saldoTotal]);

  const abrirExtrato = async (conta: IContaBancaria) => {
    try {
      setContaSelecionada(conta);
      setLoadingExtrato(true);

      const resposta = await ContaBancariaService.extrato(Number(conta.id));
      setExtrato(resposta);
    } catch (err: any) {
      console.error('Erro ao buscar extrato:', err);
      setExtrato({ erro: err.message || 'Erro ao carregar extrato.' });
    } finally {
      setLoadingExtrato(false);
    }
  };

  const excluirConta = async (conta: IContaBancaria) => {
    if (!conta.id) return;

    const confirmado = window.confirm(
      `Deseja remover ou inativar a conta "${conta.nome}"?`
    );

    if (!confirmado) return;

    try {
      await ContaBancariaService.deletar(Number(conta.id));
      await carregarContas();
      if (contaSelecionada?.id === conta.id) {
        setContaSelecionada(null);
        setExtrato(null);
      }
    } catch (err: any) {
      console.error('Erro ao excluir conta:', err);
      alert(err.message || 'Erro ao excluir conta.');
    }
  };

  const formatarMoeda = (valor: number | undefined) =>
    Number(valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  return (
    <div className="space-y-6 p-2 text-slate-100">
      <ContaBancariaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={carregarContas}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestão de Contas Bancárias</h1>
          <p className="mt-1 text-sm text-slate-400">
            Controle de saldo consolidado, contas e histórico financeiro.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-cyan-600 px-5 py-2.5 font-semibold text-white transition hover:bg-cyan-500"
        >
          + Nova Conta
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-400">Saldo consolidado</p>
          <p className="mt-2 text-2xl font-bold text-cyan-400">{formatarMoeda(resumo.consolidado)}</p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-400">Em bancos</p>
          <p className="mt-2 text-2xl font-bold text-blue-400">{formatarMoeda(resumo.emBanco)}</p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-400">Em espécie</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{formatarMoeda(resumo.emEspecie)}</p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total de contas</p>
          <p className="mt-2 text-2xl font-bold text-violet-400">{resumo.totalContas}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-12 text-center text-slate-400">
          Carregando contas...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-4">
            {contas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800 p-12 text-center text-slate-400">
                Nenhuma conta encontrada. Cadastre a primeira conta.
              </div>
            ) : (
              contas.map((conta) => (
                <div
                  key={conta.id ?? `${conta.nome}-${conta.banco}`}
                  className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-md"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-cyan-500/20 px-2.5 py-1 text-xs font-semibold uppercase text-cyan-300">
                          {conta.tipo}
                        </span>
                        <span className="text-xs text-slate-400">{conta.banco}</span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-white">{conta.nome}</h2>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Saldo atual</p>
                      <p className={`mt-1 text-2xl font-bold ${Number(conta.saldo_atual ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatarMoeda(conta.saldo_atual)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-700 pt-4 text-sm text-slate-300">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        {conta.agencia && <span>Agência: {conta.agencia}</span>}
                        {conta.numero_conta && <span className="ml-3">Conta: {conta.numero_conta}</span>}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => abrirExtrato(conta)}
                          className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-600"
                        >
                          Extrato
                        </button>
                        <button
                          type="button"
                          onClick={() => excluirConta(conta)}
                          className="rounded-lg bg-red-500/20 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/30"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <aside className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-md">
            <h3 className="text-lg font-bold text-white">Histórico</h3>

            {contaSelecionada ? (
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-xl bg-slate-900 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Conta selecionada</p>
                  <p className="mt-1 font-semibold text-white">{contaSelecionada.nome}</p>
                  <p className="text-slate-400">{contaSelecionada.banco}</p>
                </div>

                {loadingExtrato ? (
                  <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-400">
                    Carregando extrato...
                  </div>
                ) : extrato ? (
                  <div className="space-y-2">
                    <div className="rounded-xl bg-slate-900 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Saldo final</p>
                      <p className="mt-1 font-bold text-cyan-400">
                        {formatarMoeda(extrato?.saldoFinal ?? extrato?.conta?.saldo_atual)}
                      </p>
                    </div>

                    {extrato?.movimentacoes?.length ? (
                      extrato.movimentacoes.map((item: any) => (
                        <div key={item.id ?? `${item.descricao}-${item.data_movimentacao}`} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-white">{item.descricao || 'Movimentação'}</span>
                            <span className={`font-bold ${item.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {item.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(Number(item.valor))}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">{item.categoria} · {item.data_movimentacao}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-4 text-slate-400">
                        Nenhuma movimentação registrada nesta conta.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-4 text-slate-400">
                    Selecione uma conta para visualizar o extrato.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
                Escolha uma conta para ver o extrato e o histórico financeiro.
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

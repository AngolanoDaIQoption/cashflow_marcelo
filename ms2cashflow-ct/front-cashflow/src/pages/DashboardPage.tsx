import { useEffect, useMemo, useState } from 'react';
import { MovimentacaoModal } from '../components/MovimentacaoModal';
import type { Movimentacao } from '../types';

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);

const formatarData = (valor: string | Date | undefined) => {
  if (!valor) return '-';

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);

  return data.toLocaleDateString('pt-BR');
};

export function DashboardPage() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'entrada' | 'saida'>('todas');
  const [modalAberto, setModalAberto] = useState(false);
  const [movimentacaoEmEdicao, setMovimentacaoEmEdicao] = useState<Movimentacao | null>(null);

  const carregarMovimentacoes = async () => {
    const token = localStorage.getItem('kamikase_token');

    if (!token) {
      setErro('Sessão expirada. Faça login novamente.');
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const resposta = await fetch('http://localhost:3000/api/movimentacoes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resposta.status === 401) {
        localStorage.removeItem('kamikase_token');
        localStorage.removeItem('kamikase_usuario');
        setErro('Sessão expirada. Faça login novamente.');
        return;
      }

      if (!resposta.ok) {
        throw new Error('Falha ao buscar movimentações.');
      }

      const dados = await resposta.json();
      setMovimentacoes(dados.dados || []);
    } catch (err: any) {
      setErro(err.message || 'Não foi possível carregar movimentações.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregarMovimentacoes();
  }, []);

  const movimentacoesFiltradas = useMemo(() => {
    if (filtro === 'todas') return movimentacoes;
    return movimentacoes.filter((mov) => mov.tipo === filtro);
  }, [movimentacoes, filtro]);

  const resumo = useMemo(() => {
    const entradas = movimentacoes.reduce((total, mov) => {
      return mov.tipo === 'entrada' ? total + Number(mov.valor || 0) : total;
    }, 0);

    const saidas = movimentacoes.reduce((total, mov) => {
      return mov.tipo === 'saida' ? total + Number(mov.valor || 0) : total;
    }, 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }, [movimentacoes]);

  const abrirModalEdicao = (mov: Movimentacao) => {
    setMovimentacaoEmEdicao(mov);
    setModalAberto(true);
  };

  const deletarMovimentacao = async (mov: Movimentacao) => {
    if (!mov.id) return;

    const confirmar = window.confirm('Deseja excluir esta movimentação?');
    if (!confirmar) return;

    const token = localStorage.getItem('kamikase_token');
    if (!token) {
      setErro('Sessão expirada. Faça login novamente.');
      return;
    }

    try {
      const resposta = await fetch(`http://localhost:3000/api/movimentacoes/${mov.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        throw new Error(dados.erro || 'Erro ao excluir movimentação.');
      }

      await carregarMovimentacoes();
    } catch (err: any) {
      setErro(err.message || 'Erro ao excluir movimentação.');
    }
  };

  return (
    <div className="space-y-6 text-white">
      <MovimentacaoModal
        visivel={modalAberto}
        aoFechar={() => {
          setModalAberto(false);
          setMovimentacaoEmEdicao(null);
        }}
        aoSalvarSucesso={(mensagem) => {
          setModalAberto(false);
          setMovimentacaoEmEdicao(null);
          void carregarMovimentacoes();
          console.log(mensagem);
        }}
        movimentacaoParaEditar={movimentacaoEmEdicao}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Painel Financeiro</h1>
          <p className="mt-1 text-sm text-slate-400">Acompanhe entradas, saídas e saldo do mês.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMovimentacaoEmEdicao(null);
            setModalAberto(true);
          }}
          className="rounded-xl bg-cyan-600 px-5 py-2.5 font-semibold text-white transition hover:bg-cyan-500"
        >
          + Nova Movimentação
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-400">Entradas</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{formatarMoeda(resumo.entradas)}</p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-400">Saídas</p>
          <p className="mt-2 text-3xl font-bold text-red-400">{formatarMoeda(resumo.saidas)}</p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-400">Saldo</p>
          <p className={`mt-2 text-3xl font-bold ${resumo.saldo >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
            {formatarMoeda(resumo.saldo)}
          </p>
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {erro}
        </div>
      )}

      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-md">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-white">Extrato</h2>

          <div className="flex items-center gap-2">
            <label htmlFor="filtro" className="text-sm text-slate-400">
              Filtrar:
            </label>
            <select
              id="filtro"
              value={filtro}
              onChange={(event) => setFiltro(event.target.value as 'todas' | 'entrada' | 'saida')}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="todas">Todas</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>
        </div>

        {carregando ? (
          <div className="py-8 text-center text-slate-400">Carregando movimentações...</div>
        ) : movimentacoesFiltradas.length === 0 ? (
          <div className="py-8 text-center text-slate-400">Nenhuma movimentação encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Descrição</th>
                  <th className="px-3 py-2 font-medium">Categoria</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium text-right">Valor</th>
                  <th className="px-3 py-2 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoesFiltradas.map((mov) => (
                  <tr key={mov.id ?? `${mov.descricao}-${mov.data_movimentacao}`} className="rounded-xl bg-slate-900 text-slate-200">
                    <td className="rounded-l-xl px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          mov.tipo === 'entrada'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-red-500/15 text-red-300'
                        }`}
                      >
                        {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-3 py-3">{mov.descricao || 'Sem descrição'}</td>
                    <td className="px-3 py-3">{mov.categoria}</td>
                    <td className="px-3 py-3">{formatarData(mov.data_movimentacao)}</td>
                    <td className={`px-3 py-3 text-right font-bold ${mov.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {mov.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(Number(mov.valor || 0))}
                    </td>
                    <td className="rounded-r-xl px-3 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirModalEdicao(mov)}
                          className="rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void deletarMovimentacao(mov)}
                          className="rounded-lg bg-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

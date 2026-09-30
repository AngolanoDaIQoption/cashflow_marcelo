// 1. Resolve o Erro 1: Exportar o TipoContaBancaria
export type TipoContaBancaria = 'corrente' | 'poupanca' | 'incash';

// 2. Resolve o Erro 2: Exportar a interface IContaBancaria
export interface IContaBancaria {
  id?: number;
  usuario_id: number;
  nome: string;
  banco: string;
  agencia?: string | null;
  numero_conta?: string | null;
  tipo: TipoContaBancaria;
  saldo_inicial: number;
  saldo_atual?: number; // Propriedade calculada nas listagens
  ativo?: boolean;
  criado_em?: Date;
}

// 3. Resolve o Erro 3: Adicionar 'conta_id' na IMovimentacao
export interface IMovimentacao {
  id?: number;
  usuario_id: number;
  conta_id?: number | null; // <-- Adicionado para o relacionamento com a conta
  valor: number | string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao?: string | null;
  data_movimentacao: string | Date;
  status?: 'pago' | 'pendente';
  parcelas?: number;
  parcela_atual?: number;
  fonte_destinatario?: string;
}

// Mantém a tua interface IUsuario que já lá deve estar:
export interface IUsuario {
  id?: number;
  email: string;
  nome?: string | null;
  telefone?: string | null;
  senha?: string;
  criado_em?: Date;
  atualizado_em?: Date;
}
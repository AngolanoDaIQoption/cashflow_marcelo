export type TipoContaBancaria = 'corrente' | 'poupanca' | 'incash';

export interface IContaBancaria {
    id?: number;
    usuario_id?: number;
    nome: string;
    banco: string;
    agencia?: string | null;
    numero_conta?: string | null;
    tipo: TipoContaBancaria;
    saldo_inicial: number;
    saldo_atual?: number;
    ativo?: boolean;
    criado_em?: string;
}

export interface Movimentacao {
    id?: number;
    usuario_id?: number;
    conta_id?: number | null;
    valor: number;
    tipo: 'entrada' | 'saida';
    categoria: string;
    descricao?: string | null;
    data_movimentacao: string;
    criado_em?: string;
    atualizado_em?: string;
}


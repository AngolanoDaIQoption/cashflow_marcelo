import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { IContaBancaria, IMovimentacao } from "../types";
import { db } from "../config/database";

export class ContaBancariaModel {
  static async criar(conta: IContaBancaria): Promise<number> {
    const {
      usuario_id,
      nome,
      banco,
      agencia,
      numero_conta,
      tipo,
      saldo_inicial,
      ativo = true,
    } = conta;

    const queryStr = `
      INSERT INTO contas_bancarias 
        (usuario_id, nome, banco, agencia, numero_conta, tipo, saldo_inicial, ativo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute<ResultSetHeader>({
      sql: queryStr,
      values: [
        usuario_id,
        nome,
        banco,
        agencia || null,
        numero_conta || null,
        tipo || "corrente",
        saldo_inicial || 0.0,
        ativo ? 1 : 0,
      ],
    });

    return result.insertId;
  }

  static async listarPorUsuario(usuarioId: number): Promise<IContaBancaria[]> {
    const queryStr = `
      SELECT 
        cb.id,
        cb.usuario_id,
        cb.nome,
        cb.banco,
        cb.agencia,
        cb.numero_conta,
        cb.tipo,
        cb.saldo_inicial,
        cb.ativo,
        COALESCE(
          ROUND(cb.saldo_inicial + SUM(
            CASE 
              WHEN m.tipo = 'entrada' THEN m.valor
              WHEN m.tipo = 'saida' THEN -m.valor
              ELSE 0
            END
          ), 2),
          cb.saldo_inicial
        ) AS saldo_atual
      FROM contas_bancarias cb
      LEFT JOIN movimentacao m ON m.conta_id = cb.id
      WHERE cb.usuario_id = ? AND cb.ativo = 1
      GROUP BY cb.id
      ORDER BY cb.nome ASC
    `;

    const [linhas] = await db.execute<RowDataPacket[]>({
      sql: queryStr,
      values: [usuarioId],
    });

    return (linhas as any[]).map((linha) => ({
      ...linha,
      saldo_inicial: Number(linha.saldo_inicial),
      saldo_atual: Number(linha.saldo_atual),
      ativo: Boolean(linha.ativo),
    })) as IContaBancaria[];
  }

  static async buscarPorId(
    id: number,
    usuarioId: number,
  ): Promise<IContaBancaria | null> {
    const queryStr = `
      SELECT 
        cb.*,
        ROUND(cb.saldo_inicial + COALESCE(
          SUM(
            CASE 
              WHEN m.tipo = 'entrada' THEN m.valor
              WHEN m.tipo = 'saida' THEN -m.valor
              ELSE 0
            END
          ), 0
        ), 2) AS saldo_atual
      FROM contas_bancarias cb
      LEFT JOIN movimentacao m ON m.conta_id = cb.id
      WHERE cb.id = ? AND cb.usuario_id = ?
      GROUP BY cb.id
      LIMIT 1
    `;

    const [linhas] = await db.execute<RowDataPacket[]>({
      sql: queryStr,
      values: [id, usuarioId],
    });

    if (linhas.length === 0) return null;

    const linha = linhas[0] as any;
    return {
      ...linha,
      saldo_inicial: Number(linha.saldo_inicial),
      saldo_atual: Number(linha.saldo_atual),
      ativo: Boolean(linha.ativo),
    } as IContaBancaria;
  }

  static async atualizar(
    id: number,
    usuarioId: number,
    dados: Partial<IContaBancaria>,
  ): Promise<boolean> {
    const campos: string[] = [];
    const valores: any[] = [];

    if (dados.nome !== undefined) {
      campos.push("nome = ?");
      valores.push(dados.nome);
    }
    if (dados.banco !== undefined) {
      campos.push("banco = ?");
      valores.push(dados.banco);
    }
    if (dados.agencia !== undefined) {
      campos.push("agencia = ?");
      valores.push(dados.agencia || null);
    }
    if (dados.numero_conta !== undefined) {
      campos.push("numero_conta = ?");
      valores.push(dados.numero_conta || null);
    }
    if (dados.tipo !== undefined) {
      campos.push("tipo = ?");
      valores.push(dados.tipo);
    }
    if (dados.saldo_inicial !== undefined) {
      campos.push("saldo_inicial = ?");
      valores.push(dados.saldo_inicial);
    }
    if (dados.ativo !== undefined) {
      campos.push("ativo = ?");
      valores.push(dados.ativo ? 1 : 0);
    }

    if (campos.length === 0) return false;

    const queryStr = `UPDATE contas_bancarias SET ${campos.join(", ")} WHERE id = ? AND usuario_id = ?`;
    valores.push(id, usuarioId);

    const [result] = await db.execute<ResultSetHeader>({
      sql: queryStr,
      values: valores,
    });

    return result.affectedRows > 0;
  }

  static async deletarOuInativar(
    id: number,
    usuarioId: number,
  ): Promise<{ acao: "deletado" | "inativado"; sucesso: boolean }> {
    const conta = await this.buscarPorId(id, usuarioId);
    if (!conta) {
      return { acao: "deletado", sucesso: false };
    }

    const [movs] = await db.execute<RowDataPacket[]>({
      sql: `SELECT COUNT(*) AS total FROM movimentacao WHERE conta_id = ?`,
      values: [id],
    });

    const totalMovimentacoes = Number((movs[0] as any).total || 0);

    if (totalMovimentacoes > 0) {
      const [updateRes] = await db.execute<ResultSetHeader>({
        sql: `UPDATE contas_bancarias SET ativo = 0 WHERE id = ? AND usuario_id = ?`,
        values: [id, usuarioId],
      });
      return { acao: "inativado", sucesso: updateRes.affectedRows > 0 };
    }

    const [delRes] = await db.execute<ResultSetHeader>({
      sql: `DELETE FROM contas_bancarias WHERE id = ? AND usuario_id = ?`,
      values: [id, usuarioId],
    });

    return { acao: "deletado", sucesso: delRes.affectedRows > 0 };
  }

  static async obterExtrato(
    contaId: number,
    usuarioId: number,
    filtros: { dataInicial?: string; dataFinal?: string; tipo?: string } = {},
  ): Promise<{
    conta: IContaBancaria;
    movimentacoes: IMovimentacao[];
    totalEntradas: number;
    totalSaidas: number;
    saldoFinal: number;
  } | null> {
    const conta = await this.buscarPorId(contaId, usuarioId);
    if (!conta) return null;

    let queryStr = `
      SELECT * FROM movimentacao 
      WHERE conta_id = ? AND usuario_id = ?
    `;
    const valores: any[] = [contaId, usuarioId];

    if (filtros.tipo) {
      queryStr += ` AND tipo = ?`;
      valores.push(filtros.tipo);
    }
    if (filtros.dataInicial && filtros.dataFinal) {
      queryStr += ` AND data_movimentacao BETWEEN ? AND ?`;
      valores.push(filtros.dataInicial, filtros.dataFinal);
    }

    queryStr += ` ORDER BY data_movimentacao DESC, id DESC`;

    const [linhas] = await db.execute<RowDataPacket[]>({
      sql: queryStr,
      values: valores,
    });

    const movimentacoes = linhas as IMovimentacao[];

    const totalEntradas = movimentacoes
      .filter((m) => m.tipo === "entrada")
      .reduce((acc, m) => acc + Number(m.valor), 0);

    const totalSaidas = movimentacoes
      .filter((m) => m.tipo === "saida")
      .reduce((acc, m) => acc + Number(m.valor), 0);

    const saldoFinal =
      Number(conta.saldo_inicial) + totalEntradas - totalSaidas;

    return {
      conta,
      movimentacoes,
      totalEntradas: Number(totalEntradas.toFixed(2)),
      totalSaidas: Number(totalSaidas.toFixed(2)),
      saldoFinal: Number(saldoFinal.toFixed(2)),
    };
  }
}

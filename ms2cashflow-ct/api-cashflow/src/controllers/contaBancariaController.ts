import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { ContaBancariaModel } from "../models/contaBancariaModel";
import { TipoContaBancaria } from "../types";

export class ContaBancariaController {
  static async criar(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId!;
      const { nome, banco, agencia, numero_conta, tipo, saldo_inicial } = req.body;

      if (!nome || !banco) {
        return res.status(400).json({ erro: "Nome e banco são obrigatórios." });
      }

      const tiposValidos: TipoContaBancaria[] = ["corrente", "poupanca", "incash"];
      const tipoNormalizado: TipoContaBancaria = tiposValidos.includes(tipo)
        ? tipo
        : "corrente";

      const id = await ContaBancariaModel.criar({
        usuario_id: usuarioId,
        nome: String(nome).trim(),
        banco: String(banco).trim(),
        agencia: tipoNormalizado === "incash" ? null : agencia?.trim() || null,
        numero_conta: tipoNormalizado === "incash" ? null : numero_conta?.trim() || null,
        tipo: tipoNormalizado,
        saldo_inicial: Number(saldo_inicial) || 0.0,
        ativo: true,
      });

      return res.status(201).json({
        id,
        mensagem: "Conta bancária cadastrada com sucesso.",
      });
    } catch (error) {
      console.error("[ContaBancariaController.criar]", error);
      return res.status(500).json({ erro: "Erro ao cadastrar conta bancária." });
    }
  }

  static async listar(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId!;
      const contas = await ContaBancariaModel.listarPorUsuario(usuarioId);

      const saldoTotalConsolidado = contas.reduce(
        (acc, c) => acc + (c.saldo_atual ?? 0),
        0
      );

      return res.status(200).json({
        totalContas: contas.length,
        saldoTotalConsolidado: Number(saldoTotalConsolidado.toFixed(2)),
        contas,
      });
    } catch (error) {
      console.error("[ContaBancariaController.listar]", error);
      return res.status(500).json({ erro: "Erro ao listar contas bancárias." });
    }
  }

  static async buscarPorId(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const usuarioId = req.usuarioId!;

      if (isNaN(id)) {
        return res.status(400).json({ erro: "ID de conta inválido." });
      }

      const conta = await ContaBancariaModel.buscarPorId(id, usuarioId);

      if (!conta) {
        return res.status(404).json({ erro: "Conta bancária não encontrada." });
      }

      return res.status(200).json(conta);
    } catch (error) {
      console.error("[ContaBancariaController.buscarPorId]", error);
      return res.status(500).json({ erro: "Erro ao buscar conta bancária." });
    }
  }

  static async atualizar(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const usuarioId = req.usuarioId!;

      if (isNaN(id)) {
        return res.status(400).json({ erro: "ID de conta inválido." });
      }

      const { nome, banco, agencia, numero_conta, tipo, saldo_inicial, ativo } = req.body;

      const dadosParaAtualizar: any = {};
      if (nome !== undefined) dadosParaAtualizar.nome = String(nome).trim();
      if (banco !== undefined) dadosParaAtualizar.banco = String(banco).trim();
      if (agencia !== undefined) dadosParaAtualizar.agencia = agencia ? String(agencia).trim() : null;
      if (numero_conta !== undefined) dadosParaAtualizar.numero_conta = numero_conta ? String(numero_conta).trim() : null;
      if (tipo !== undefined) dadosParaAtualizar.tipo = tipo;
      if (saldo_inicial !== undefined) dadosParaAtualizar.saldo_inicial = Number(saldo_inicial);
      if (ativo !== undefined) dadosParaAtualizar.ativo = Boolean(ativo);

      const sucesso = await ContaBancariaModel.atualizar(id, usuarioId, dadosParaAtualizar);

      if (!sucesso) {
        return res.status(404).json({ erro: "Conta não encontrada ou nenhuma alteração realizada." });
      }

      return res.status(200).json({ mensagem: "Conta bancária atualizada com sucesso." });
    } catch (error) {
      console.error("[ContaBancariaController.atualizar]", error);
      return res.status(500).json({ erro: "Erro ao atualizar conta bancária." });
    }
  }

  static async deletar(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const usuarioId = req.usuarioId!;

      if (isNaN(id)) {
        return res.status(400).json({ erro: "ID de conta inválido." });
      }

      const resultado = await ContaBancariaModel.deletarOuInativar(id, usuarioId);

      if (!resultado.sucesso) {
        return res.status(404).json({ erro: "Conta bancária não encontrada." });
      }

      if (resultado.acao === "inativado") {
        return res.status(200).json({
          mensagem: "A conta possui movimentações registradas e foi desativada para preservar o histórico financeiro.",
          acao: "inativado",
        });
      }

      return res.status(200).json({
        mensagem: "Conta bancária excluída com sucesso.",
        acao: "deletado",
      });
    } catch (error) {
      console.error("[ContaBancariaController.deletar]", error);
      return res.status(500).json({ erro: "Erro ao excluir conta bancária." });
    }
  }

  static async extrato(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const usuarioId = req.usuarioId!;

      if (isNaN(id)) {
        return res.status(400).json({ erro: "ID de conta inválido." });
      }

      const extrato = await ContaBancariaModel.obterExtrato(id, usuarioId, req.query);

      if (!extrato) {
        return res.status(404).json({ erro: "Conta bancária não encontrada." });
      }

      return res.status(200).json(extrato);
    } catch (error) {
      console.error("[ContaBancariaController.extrato]", error);
      return res.status(500).json({ erro: "Erro ao gerar extrato da conta." });
    }
  }
}

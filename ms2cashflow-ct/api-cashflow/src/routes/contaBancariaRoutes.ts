import { Router } from "express";
import { ContaBancariaController } from "../controllers/contaBancariaController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware as any);

router.post("/", ContaBancariaController.criar as any);
router.get("/", ContaBancariaController.listar as any);
router.get("/:id", ContaBancariaController.buscarPorId as any);
router.get("/:id/extrato", ContaBancariaController.extrato as any);
router.put("/:id", ContaBancariaController.atualizar as any);
router.patch("/:id", ContaBancariaController.atualizar as any);
router.delete("/:id", ContaBancariaController.deletar as any);

export default router;

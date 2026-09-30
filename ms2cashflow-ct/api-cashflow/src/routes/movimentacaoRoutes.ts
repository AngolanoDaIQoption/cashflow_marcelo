import { Router } from 'express';
import { MovimentacaoController } from '../controllers/movimentacaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Aplica o middleware de autenticação JWT
router.use(authMiddleware as any);

// Rotas do CRUD (Notar que usam '/')
router.post('/', MovimentacaoController.criar as any);
router.get('/', MovimentacaoController.listar as any);
router.get('/:id', MovimentacaoController.buscarPorId as any);
router.patch('/:id', MovimentacaoController.atualizar as any);
router.delete('/:id', MovimentacaoController.deletar as any);

export default router;
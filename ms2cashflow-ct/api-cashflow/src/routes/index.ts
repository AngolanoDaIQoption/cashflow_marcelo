import { Router } from 'express';
import usuarioRoutes from './usuarioRoutes';
import movimentacaoRoutes from './movimentacaoRoutes';
import contaBancariaRoutes from './contaBancariaRoutes'; // <-- Adicionado

const router = Router();

router.use('/usuarios', usuarioRoutes);
router.use('/movimentacoes', movimentacaoRoutes);
router.use('/contas', contaBancariaRoutes); // <-- Adicionado

export default router;
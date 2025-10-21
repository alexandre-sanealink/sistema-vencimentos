import express from 'express';
// (NOVO) Importa a nova função 'listarTodasNotificacoes'
import { listarNotificacoes, marcarComoLida, listarTodasNotificacoes } from '../controllers/NotificacaoController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);

// Rota para o painel do sino (busca apenas não lidas)
router.get('/', listarNotificacoes);

// (NOVO) Rota para a página "Central de Notificações" (busca todas)
router.get('/todas', listarTodasNotificacoes);

// Rota para marcar uma notificação específica como lida
router.patch('/:id/read', marcarComoLida);

export default router;
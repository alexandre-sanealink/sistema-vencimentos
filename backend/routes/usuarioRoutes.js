// INÍCIO DO CÓDIGO PARA SUBSTITUIR (usuarioRoutes.js)
import express from 'express';
import {
    listarUsuarios,
    atualizarRoleUsuario,
    atualizarSenhaUsuario,
    deletarUsuario
} from '../controllers/UsuarioController.js';
import { verificarToken, verificarSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Aplica a segurança em TODAS as rotas deste arquivo
router.use(verificarToken, verificarSuperAdmin);

// --- ROTAS DE GERENCIAMENTO DE USUÁRIOS ---

// Rota para listar todos os usuários (agora em GET /)
router.get('/', listarUsuarios);

// Rota para atualizar o papel (role) de um usuário (agora em PUT /:id/role)
router.put('/:id/role', atualizarRoleUsuario);

// Rota para atualizar a senha de um usuário (agora em PUT /:id/password)
router.put('/:id/password', atualizarSenhaUsuario);

// Rota para deletar um usuário (agora em DELETE /:id)
router.delete('/:id', deletarUsuario);

export default router;
// FIM DO CÓDIGO PARA SUBSTITUIR
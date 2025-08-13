import express from 'express';
import {
    listarUsuarios,
    atualizarRoleUsuario,
    atualizarSenhaUsuario,
    deletarUsuario
} from '../controllers/UsuarioController.js';
import { verificarToken, verificarSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Aplica a segurança em TODAS as rotas deste arquivo.
// Primeiro, verifica se o usuário está logado (verificarToken).
// Depois, verifica se o usuário logado é SUPER_ADMIN (verificarSuperAdmin).
router.use(verificarToken, verificarSuperAdmin);

// --- ROTAS DE GERENCIAMENTO DE USUÁRIOS ---

// Rota para listar todos os usuários
// GET /api/usuarios
router.get('/usuarios', listarUsuarios);

// Rota para atualizar o papel (role) de um usuário específico
// PUT /api/usuarios/:id/role
router.put('/usuarios/:id/role', atualizarRoleUsuario);

// Rota para atualizar a senha de um usuário específico
// PUT /api/usuarios/:id/password
router.put('/usuarios/:id/password', atualizarSenhaUsuario);

// Rota para deletar um usuário específico
// DELETE /api/usuarios/:id
router.delete('/usuarios/:id', deletarUsuario);

export default router;
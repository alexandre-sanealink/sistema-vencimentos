import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// Usa a mesma configuração de conexão dos outros controllers
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGHOST !== 'localhost' ? { rejectUnauthorized: false } : false
});


// --- FUNÇÕES DO CONTROLLER DE USUÁRIOS ---

/**
 * Lista todos os usuários do sistema, exceto a senha.
 * Rota: GET /api/usuarios
 */
export const listarUsuarios = async (req, res) => {
    try {
        // Seleciona colunas específicas para não expor o hash da senha
        const { rows } = await pool.query('SELECT id, nome, email, role FROM usuarios ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

/**
 * Atualiza o papel (role) de um usuário específico.
 * Rota: PUT /api/usuarios/:id/role
 */
export const atualizarRoleUsuario = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const rolesPermitidos = ['SUPER_ADMIN', 'ESCRITORIO', 'ENCARREGADO', 'MECANICO'];
    if (!rolesPermitidos.includes(role)) {
        return res.status(400).json({ error: 'Papel (Role) inválido.' });
    }

    // Trava de segurança para impedir que o Super Admin rebaixe a si mesmo
    if (req.usuario.id == id && role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'O Super Admin não pode alterar o próprio papel.' });
    }

    try {
        const query = 'UPDATE usuarios SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, nome, email, role';
        const { rows } = await pool.query(query, [role, id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar papel do usuário:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

/**
 * Atualiza a senha de um usuário específico.
 * Rota: PUT /api/usuarios/:id/password
 */
export const atualizarSenhaUsuario = async (req, res) => {
    const { id } = req.params;
    const { novaSenha } = req.body;

    if (!novaSenha || novaSenha.length < 6) {
        return res.status(400).json({ error: 'A nova senha é obrigatória e deve ter pelo menos 6 caracteres.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(novaSenha, salt);
        
        const query = 'UPDATE usuarios SET senha_hash = $1, updated_at = NOW() WHERE id = $2';
        await pool.query(query, [senhaHash, id]);

        res.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar senha do usuário:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

/**
 * Deleta um usuário específico.
 * Rota: DELETE /api/usuarios/:id
 */
export const deletarUsuario = async (req, res) => {
    const { id } = req.params;
    
    // Trava de segurança para impedir que um usuário delete a si mesmo
    if (req.usuario.id == id) {
        return res.status(403).json({ error: 'Você não pode deletar sua própria conta.' });
    }

    try {
        const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(200).json({ message: 'Usuário deletado com sucesso.' });
    } catch (error)
       { console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
import pg from 'pg';
import 'dotenv/config';

// Configuração da conexão com o banco de dados
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGHOST && process.env.PGHOST !== 'localhost'
        ? { rejectUnauthorized: false }
        : false,
});

/**
 * Busca as notificações não lidas para o usuário logado.
 * Rota: GET /api/notificacoes
 */
export const listarNotificacoes = async (req, res) => {
    const usuarioId = req.usuario.id; // O ID do usuário vem do token que já foi verificado

    try {
        const query = `
            SELECT * FROM notificacoes 
            WHERE usuario_id = $1 AND lida = FALSE 
            ORDER BY created_at DESC;
        `;
        const { rows } = await pool.query(query, [usuarioId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao listar notificações:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

/**
 * Marca uma notificação específica como lida.
 * Rota: PATCH /api/notificacoes/:id/read
 */
export const marcarComoLida = async (req, res) => {
    const { id: notificacaoId } = req.params; // Pega o ID da notificação pela URL
    const usuarioId = req.usuario.id; // Pega o ID do usuário logado pelo token

    try {
        const query = `
            UPDATE notificacoes 
            SET lida = TRUE
            WHERE id = $1 AND usuario_id = $2
            RETURNING *;
        `;
        const { rows, rowCount } = await pool.query(query, [notificacaoId, usuarioId]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Notificação não encontrada ou não pertence ao usuário.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

/**
 * (NOVO) Busca TODAS as notificações para o usuário logado (lidas e não lidas).
 * Rota: GET /api/notificacoes/todas
 */
export const listarTodasNotificacoes = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        const query = `
            SELECT * FROM notificacoes 
            WHERE usuario_id = $1
            ORDER BY created_at DESC;
        `;
        const { rows } = await pool.query(query, [usuarioId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao listar todas as notificações:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
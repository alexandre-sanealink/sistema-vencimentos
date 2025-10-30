import pg from 'pg'; // Importa a biblioteca pg
const { Pool } = pg; // Extrai a classe Pool
import 'dotenv/config';

// Configuração da conexão (agora com a lógica condicional)
const pool = new Pool(
    process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } 
      } 
    : {} 
);

/**
 * Busca as notificações não lidas para o usuário logado.
 * Rota: GET /api/notificacoes
 */
export const listarNotificacoes = async (req, res) => {
    const usuarioId = req.usuario.id; 

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
    const { id: notificacaoId } = req.params; 
    const usuarioId = req.usuario.id; 

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
    const { status = 'naolida', pagina = '1' } = req.query; 
    const paginaAtual = parseInt(pagina, 10);
    const itensPorPagina = 15;
    const offset = (paginaAtual - 1) * itensPorPagina;

    let lidaStatus;
    if (status === 'lida') {
        lidaStatus = true;
    } else {
        lidaStatus = false;
    }

    try {
        // Query 1 (Contagem Total - Agora em linha única)
        const totalQuery = `SELECT COUNT(*) FROM notificacoes WHERE usuario_id = $1 AND lida = $2`;
        
        const totalResult = await pool.query(totalQuery, [usuarioId, lidaStatus]);
        const totalItens = parseInt(totalResult.rows[0].count, 10);
        const totalPaginas = Math.ceil(totalItens / itensPorPagina);

        // Query 2 (Busca Paginada - Agora em linha única)
        const query = `SELECT * FROM notificacoes WHERE usuario_id = $1 AND lida = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`;

        const { rows } = await pool.query(query, [usuarioId, lidaStatus, itensPorPagina, offset]);
        
        res.status(200).json({
            notificacoes: rows,
            totalPaginas: totalPaginas,
            paginaAtual: paginaAtual
        });

    } catch (error) {
        console.error('Erro ao listar todas as notificações:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
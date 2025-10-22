import pg from 'pg';
const { Pool } = pg;
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração da conexão (com lógica condicional)
const pool = new Pool(
    process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {}
);

// --- Lógica para obter caminho de uploads ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_RENDER = 'RENDER' in process.env;
// Aponta para a pasta 'uploads' que está UM NÍVEL ACIMA da pasta 'controllers'
const uploadDir = IS_RENDER ? '/var/data/uploads' : path.join(__dirname, '..', 'uploads');

// --- FUNÇÕES DO CONTROLLER ---

/**
 * Lista todos os documentos.
 * Rota: GET /api/documentos
 */
export const listarDocumentos = async (req, res) => {
    try {
        const query = `
            SELECT doc.*, u.nome as criado_por_nome 
            FROM documentos doc 
            LEFT JOIN usuarios u ON doc.criado_por_email = u.email 
            ORDER BY doc."dataVencimento" ASC
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

/**
 * Cria um novo documento.
 * Rota: POST /api/documentos
 */
export const criarDocumento = async (req, res) => {
    try {
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;
        const nomeArquivo = req.file ? req.file.filename : null; // Nome do arquivo vem do multer

        // Validação básica
        if (!nome || !categoria || !dataVencimento || !diasAlerta) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios (exceto anexo).' });
        }

        const query = `
            INSERT INTO documentos (id, nome, categoria, "dataVencimento", "diasAlerta", status, criado_por_email, nome_arquivo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
        `;
        // Usamos Date.now() para ID como antes, mas talvez revisar isso no futuro
        const values = [String(Date.now()), nome, categoria, dataVencimento, parseInt(diasAlerta, 10), 'Pendente', req.usuario.email, nomeArquivo];
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao cadastrar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

/**
 * Atualiza um documento existente.
 * Rota: PUT /api/documentos/:id
 */
export const atualizarDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;
        let query;
        let values;

        // Validação básica
        if (!nome || !categoria || !dataVencimento || !diasAlerta) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios (exceto anexo).' });
        }

        if (req.file) { // Se um novo arquivo foi enviado
            const nomeArquivo = req.file.filename;
            query = `
                UPDATE documentos SET nome = $1, categoria = $2, "dataVencimento" = $3, "diasAlerta" = $4, 
                                     modificado_em = $5, nome_arquivo = $6
                WHERE id = $7 RETURNING *
            `;
            values = [nome, categoria, dataVencimento, parseInt(diasAlerta, 10), new Date(), nomeArquivo, id];
            // Poderíamos adicionar lógica para deletar o arquivo antigo aqui, se necessário.
        } else { // Se nenhum arquivo novo foi enviado
            query = `
                UPDATE documentos SET nome = $1, categoria = $2, "dataVencimento" = $3, "diasAlerta" = $4, 
                                     modificado_em = $5
                WHERE id = $6 RETURNING *
            `;
            values = [nome, categoria, dataVencimento, parseInt(diasAlerta, 10), new Date(), id];
        }
        const { rows } = await pool.query(query, values);
        if (rows.length === 0) { return res.status(404).json({ message: 'Documento não encontrado.' }); }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

/**
 * Deleta um documento.
 * Rota: DELETE /api/documentos/:id
 */
export const deletarDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        // 1. Busca o nome do arquivo antes de deletar o registro
        const selectQuery = 'SELECT nome_arquivo FROM documentos WHERE id = $1';
        const selectResult = await pool.query(selectQuery, [id]);

        if (selectResult.rowCount === 0) {
            return res.status(404).json({ message: 'Documento não encontrado.' });
        }
        const nomeArquivo = selectResult.rows[0].nome_arquivo;

        // 2. Deleta o registro do banco
        const deleteQuery = 'DELETE FROM documentos WHERE id = $1';
        await pool.query(deleteQuery, [id]);

        // 3. Se havia um arquivo associado, tenta deletar o arquivo físico
        if (nomeArquivo) {
            const caminhoArquivo = path.join(uploadDir, nomeArquivo);
            try {
                await fs.unlink(caminhoArquivo);
                console.log(`Arquivo físico deletado: ${caminhoArquivo}`);
            } catch (fileError) {
                // Loga o erro mas não impede a resposta de sucesso,
                // pois o registro no banco foi deletado.
                console.error(`Aviso: Falha ao deletar o arquivo físico ${caminhoArquivo}:`, fileError.message);
            }
        }
        res.status(200).json({ message: 'Documento deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


// =================================================================
// --- NOVA FUNÇÃO PARA O DASHBOARD (FASE 5) ---
// =================================================================
/**
 * Obtém dados resumidos sobre os documentos para o dashboard.
 * Rota: GET /api/documentos/resumo
 */
export const obterResumoDocumentos = async (req, res) => {
    // Garante que apenas Admin e Escritório acessem
     if (req.usuario.role !== 'SUPER_ADMIN' && req.usuario.role !== 'ESCRITORIO') {
        return res.status(403).json({ message: 'Acesso não autorizado.' });
    }

    try {
        const hoje = new Date().toISOString().split('T')[0]; // Data de hoje no formato YYYY-MM-DD
        const dataLimiteAlerta = new Date();
        dataLimiteAlerta.setDate(dataLimiteAlerta.getDate() + 30); // Define o limite para "a vencer" (30 dias)
        const dataLimiteAlertaStr = dataLimiteAlerta.toISOString().split('T')[0];

        // Query para contagens gerais
        const contagemQuery = `
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE "dataVencimento" < $1) AS vencidos,
                COUNT(*) FILTER (WHERE "dataVencimento" >= $1 AND "dataVencimento" <= $2) AS aVencer30d
            FROM documentos;
        `;
        const contagemResult = await pool.query(contagemQuery, [hoje, dataLimiteAlertaStr]);
        const contagens = contagemResult.rows[0];

        // Query para buscar os próximos 5 documentos a vencer
        const proximosQuery = `
            SELECT id, nome, "dataVencimento" 
            FROM documentos 
            WHERE "dataVencimento" >= $1 
            ORDER BY "dataVencimento" ASC 
            LIMIT 5;
        `;
        const proximosResult = await pool.query(proximosQuery, [hoje]);
        const proximosVencimentos = proximosResult.rows;

        // Monta o objeto de resposta
        const resumo = {
            total: parseInt(contagens.total, 10),
            vencidos: parseInt(contagens.vencidos, 10),
            aVencer30d: parseInt(contagens.avencer30d, 10),
            proximosVencimentos: proximosVencimentos
        };

        res.status(200).json(resumo);

    } catch (error) {
        console.error('Erro ao obter resumo de documentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
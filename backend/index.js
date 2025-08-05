import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import './mailer.js';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(process.cwd(), '../frontend')));

// --- ROTA DE LOGIN ATUALIZADA COM "ESPIÕES" ---
app.post('/api/login', async (req, res) => {
    console.log('[LOGIN-DEBUG] 1. Rota de login recebida.');
    const { email, senha } = req.body;
    try {
        console.log(`[LOGIN-DEBUG] 2. Tentando buscar usuário '${email}' no banco...`);
        const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        console.log('[LOGIN-DEBUG] 3. Busca no banco de dados concluída.');

        if (resultado.rowCount === 0) {
            console.log('[LOGIN-DEBUG] Usuário não encontrado.');
            return res.status(400).json({ message: 'Email ou senha inválidos.' });
        }
        const usuario = resultado.rows[0];

        console.log('[LOGIN-DEBUG] 4. Comparando a senha...');
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        console.log('[LOGIN-DEBUG] 5. Comparação de senha concluída.');

        if (!senhaValida) {
            console.log('[LOGIN-DEBUG] Senha inválida.');
            return res.status(400).json({ message: 'Email ou senha inválidos.' });
        }

        console.log('[LOGIN-DEBUG] 6. Gerando o token...');
        const token = jwt.sign({ id: usuario.id, email: usuario.email, nome: usuario.nome }, process.env.JWT_SECRET, { expiresIn: '8h' });
        
        console.log('[LOGIN-DEBUG] 7. Enviando resposta de sucesso.');
        res.status(200).json({ token, usuario: { id: usuario.id, email: usuario.email, nome: usuario.nome } });

    } catch (error) {
        console.error('[LOGIN-DEBUG] ERRO CRÍTICO NO LOGIN:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// (O restante do código continua o mesmo)
// #region CÓDIGO RESTANTE
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) { return res.sendStatus(401); }
    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) { return res.sendStatus(403); }
        req.usuario = usuario;
        next();
    });
};
app.post('/api/register', verificarToken, async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) { return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' }); }
    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const query = `INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, email, nome`;
        const { rows } = await pool.query(query, [nome, email, senhaHash]);
        res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: rows[0] });
    } catch (error) {
        if (error.code === '23505') { return res.status(409).json({ message: 'Este email já está cadastrado.' }); }
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
app.put('/api/perfil', verificarToken, async (req, res) => {
    const { nome } = req.body;
    const usuarioId = req.usuario.id;
    if (!nome) { return res.status(400).json({ message: 'O nome é obrigatório.' }); }
    try {
        const query = `UPDATE usuarios SET nome = $1 WHERE id = $2 RETURNING id, email, nome`;
        const { rows } = await pool.query(query, [nome, usuarioId]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
app.get('/api/documentos', verificarToken, async (req, res) => {
    try {
        const query = `
            SELECT doc.id, doc.nome, doc.categoria, doc."dataVencimento",
            doc."diasAlerta", doc.status, doc.criado_por_email, doc.modificado_em,
            u.nome as criado_por_nome
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
});
app.post('/api/documentos', verificarToken, async (req, res) => {
    try {
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;
        const query = `INSERT INTO documentos (id, nome, categoria, "dataVencimento", "diasAlerta", status, criado_por_email)
                       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const values = [Date.now(), nome, categoria, dataVencimento, parseInt(diasAlerta, 10), 'Pendente', req.usuario.email];
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao cadastrar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
app.put('/api/documentos/:id', verificarToken, async (req, res) => {
    try {
        const idDocumento = parseInt(req.params.id, 10);
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;
        const query = `UPDATE documentos SET nome = $1, categoria = $2, "dataVencimento" = $3, "diasAlerta" = $4, modificado_em = $5
                       WHERE id = $6 RETURNING *`;
        const values = [nome, categoria, dataVencimento, parseInt(diasAlerta, 10), new Date(), idDocumento];
        const { rows } = await pool.query(query, values);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}.`);
});
// #endregion
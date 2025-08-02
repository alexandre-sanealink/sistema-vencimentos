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

// ROTA DE SETUP TEMPORÁRIA (USE UMA VEZ E DEPOIS PODE REMOVER)
app.get('/api/setup/add-name-column', async (req, res) => {
    try {
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nome VARCHAR(255);`);
        await pool.query(`UPDATE usuarios SET nome = 'Admin Padrão' WHERE nome IS NULL;`);
        res.status(200).send('✅ Coluna "nome" adicionada/verificada e usuários antigos atualizados!');
    } catch (error) {
        console.error("❌ Erro ao alterar a tabela 'usuarios':", error);
        res.status(500).send('Erro durante a atualização do banco de dados.');
    }
});

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

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (resultado.rowCount === 0) { return res.status(400).json({ message: 'Email ou senha inválidos.' }); }
        const usuario = resultado.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) { return res.status(400).json({ message: 'Email ou senha inválidos.' }); }
        const token = jwt.sign({ id: usuario.id, email: usuario.email, nome: usuario.nome }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ token, usuario: { id: usuario.id, email: usuario.email, nome: usuario.nome } });
    } catch (error) { res.status(500).json({ message: 'Erro interno do servidor' }); }
});

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
            SELECT doc.id, doc.nome, doc.categoria, doc."dataVencimento", doc."diasAlerta", doc.status, doc.criado_por_email, doc.modificado_em, u.nome as criado_por_nome
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
import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import './mailer.js';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer'; // Re-adicionado
import fs from 'fs'; // Módulo de arquivos do Node

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- CONFIGURAÇÃO DO UPLOAD ---
const UPLOAD_DIR = '/var/data/uploads';
// Garante que o diretório de uploads exista
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const nomeUnico = Date.now() + '-' + file.originalname;
        cb(null, nomeUnico);
    }
});
const upload = multer({ storage: storage });

const app = express();
app.use(express.json());
app.use(cors());

// --- MIDDLEWARE DE SEGURANÇA ---
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

// SERVE OS ARQUIVOS ESTÁTICOS DO FRONTEND
app.use(express.static(path.join(process.cwd(), '../frontend')));
// SERVE A PASTA DE UPLOADS DE FORMA SEGURA (APENAS PARA USUÁRIOS LOGADOS)
app.use('/uploads', verificarToken, express.static(UPLOAD_DIR));


// --- ROTA DE SETUP TEMPORÁRIA ---
app.get('/api/setup/add-file-column', async (req, res) => {
    try {
        await pool.query(`ALTER TABLE documentos ADD COLUMN IF NOT EXISTS nome_arquivo VARCHAR(255);`);
        res.status(200).send('✅ Coluna "nome_arquivo" adicionada/verificada com sucesso!');
    } catch (error) {
        console.error("❌ Erro ao alterar a tabela 'documentos':", error);
        res.status(500).send('Erro durante a atualização do banco de dados.');
    }
});

// --- ROTAS DE AUTENTICAÇÃO E PERFIL (sem alteração) ---
app.post('/api/login', async (req, res) => { /* ... */ });
app.post('/api/register', verificarToken, async (req, res) => { /* ... */ });
app.put('/api/perfil', verificarToken, async (req, res) => { /* ... */ });

// --- ROTAS DE DOCUMENTOS (ATUALIZADAS PARA UPLOAD) ---
app.get('/api/documentos', verificarToken, async (req, res) => { /* ... */ });

app.post('/api/documentos', verificarToken, upload.single('arquivo'), async (req, res) => {
    try {
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;
        const query = `INSERT INTO documentos (id, nome, categoria, "dataVencimento", "diasAlerta", status, criado_por_email, nome_arquivo)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
        const values = [Date.now(), nome, categoria, dataVencimento, parseInt(diasAlerta, 10), 'Pendente', req.usuario.email, req.file ? req.file.filename : null];
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao cadastrar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.put('/api/documentos/:id', verificarToken, upload.single('arquivo'), async (req, res) => {
    try {
        const idDocumento = parseInt(req.params.id, 10);
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;
        
        // Busca o documento antigo para poder apagar o arquivo se um novo for enviado
        const docAntigo = await pool.query('SELECT nome_arquivo FROM documentos WHERE id = $1', [idDocumento]);

        if (req.file && docAntigo.rowCount > 0 && docAntigo.rows[0].nome_arquivo) {
            fs.unlink(path.join(UPLOAD_DIR, docAntigo.rows[0].nome_arquivo), err => {
                if (err) console.error("Erro ao deletar arquivo antigo:", err);
            });
        }

        const query = `UPDATE documentos 
                       SET nome = $1, categoria = $2, "dataVencimento" = $3, "diasAlerta" = $4, modificado_em = $5, nome_arquivo = $6
                       WHERE id = $7 RETURNING *`;
        const novoNomeArquivo = req.file ? req.file.filename : docAntigo.rows[0].nome_arquivo;
        const values = [nome, categoria, dataVencimento, parseInt(diasAlerta, 10), new Date(), novoNomeArquivo, idDocumento];
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
import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import fs from 'fs/promises';
import pg from 'pg'; // <--- Importação necessária
const { Pool } = pg; // <--- Extração da classe Pool
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { fileURLToPath } from 'url';

import veiculoRoutes from './routes/veiculoRoutes.js';
import documentoRoutes from './routes/documentoRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import notificacaoRoutes from './routes/notificacaoRoutes.js';
import { verificarToken } from './middleware/authMiddleware.js';
import './mailer.js';
import { iniciarScheduler } from './scheduler.js'; 


// --- CONFIGURAÇÕES INICIAIS ---
const pool = new Pool( // <--- Agora o Pool será reconhecido
    process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } 
      } 
    : {} 
);



const app = express();
app.use(express.json());
app.use(cors({
    exposedHeaders: ['Content-Disposition'], // Permite que o frontend leia este header
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- LÓGICA DE UPLOAD INTELIGENTE ---
// Define o caminho de upload com base no ambiente
const IS_RENDER = 'RENDER' in process.env;
const uploadDir = IS_RENDER ? '/var/data/uploads' : path.join(__dirname, 'uploads');

// Garante que o diretório de upload local exista
if (!IS_RENDER) {
    fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
}

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Serve os arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(uploadDir));


// --- ROTAS DA API ---

// == ROTAS PÚBLICAS (não precisam de token) ==
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (resultado.rowCount === 0) { return res.status(401).json({ message: 'Email ou senha inválidos.' }); }
        
        const usuario = resultado.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) { return res.status(401).json({ message: 'Email ou senha inválidos.' }); }
        
        const tokenPayload = { id: usuario.id, email: usuario.email, nome: usuario.nome, role: usuario.role };
        const usuarioInfo = { id: usuario.id, email: usuario.email, nome: usuario.nome, role: usuario.role };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ token, usuario: usuarioInfo });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// == ROTAS PROTEGIDAS (precisam de token) ==
// A ordem aqui é importante. Rotas mais específicas primeiro.
app.use('/api/usuarios', usuarioRoutes); // Já tem proteção interna de Super Admin
app.use('/api/veiculos', verificarToken, veiculoRoutes); 
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/documentos', verificarToken, documentoRoutes);






app.post('/api/register', verificarToken, async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) { return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' }); }
    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const query = `INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'ESCRITORIO') RETURNING id, email, nome, role`;
        const { rows } = await pool.query(query, [nome, email, senhaHash]);
        res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: rows[0] });
    } catch (error) {
        if (error.code === '23505') { return res.status(409).json({ message: 'Este email já está cadastrado.' }); }
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.put('/api/perfil', verificarToken, async (req, res) => {
    const { nome } = req.body;
    const usuarioId = req.usuario.id;
    if (!nome) { return res.status(400).json({ message: 'O nome é obrigatório.' }); }
    try {
        const query = `UPDATE usuarios SET nome = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, nome, role`;
        const { rows } = await pool.query(query, [nome, usuarioId]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORTA = process.env.PORT || 3000;

iniciarScheduler();

app.listen(PORTA, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}.`);
});
// FIM DO CÓDIGO PARA SUBSTITUIR
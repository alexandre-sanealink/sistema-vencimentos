import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import './mailer.js';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { fileURLToPath } from 'url';
import veiculoRoutes from './routes/veiculoRoutes.js'; // NOVO: Importa as rotas de veículos


    // Ativa o SSL apenas se NÃO estivermos no ambiente local.
    ssl: process.env.PGHOST !== 'localhost' ? { rejectUnauthorized: false } : false


const connectionConfig = {
    // A biblioteca irá usar as variáveis PG... do .env automaticamente
    // USA SSL APENAS SE NÃO FOR LOCAL (ex: no Render)
    ssl: IS_LOCAL_ENV ? false : { rejectUnauthorized: false }
};

const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve os arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));
// ALTERADO: Agora, a rota /uploads serve os arquivos a partir do disco permanente do Render
app.use('/uploads', express.static('/var/data/uploads'));


// ALTERADO: Configuração do Multer para salvar os arquivos no disco permanente do Render
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/var/data/uploads'); // Caminho exato do seu Render Disk
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });


// --- MIDDLEWARE DE AUTENTICAÇÃO ---
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


// --- ROTAS DA API ---
app.use('/api', veiculoRoutes); // NOVO: Diz ao app para usar as rotas de veículos

// Rota de Login
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    const client = new pg.Client(connectionConfig);
    try {
        await client.connect();
        const resultado = await client.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (resultado.rowCount === 0) { return res.status(400).json({ message: 'Email ou senha inválidos.' }); }
        const usuario = resultado.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) { return res.status(400).json({ message: 'Email ou senha inválidos.' }); }
        const token = jwt.sign({ id: usuario.id, email: usuario.email, nome: usuario.nome }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ token, usuario: { id: usuario.id, email: usuario.email, nome: usuario.nome } });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        await client.end();
    }
});

// Rota para buscar todos os documentos
app.get('/api/documentos', verificarToken, async (req, res) => {
    const client = new pg.Client(connectionConfig);
    try {
        await client.connect();
        const query = `SELECT doc.*, u.nome as criado_por_nome FROM documentos doc LEFT JOIN usuarios u ON doc.criado_por_email = u.email ORDER BY doc."dataVencimento" ASC`;
        const { rows } = await client.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        await client.end();
    }
});

// Rota para criar um novo documento
app.post('/api/documentos', verificarToken, upload.single('arquivo'), async (req, res) => {
    const client = new pg.Client(connectionConfig);
    try {
        await client.connect();
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;
        const nomeArquivo = req.file ? req.file.filename : null;

        const query = `INSERT INTO documentos (id, nome, categoria, "dataVencimento", "diasAlerta", status, criado_por_email, nome_arquivo)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
        const values = [String(Date.now()), nome, categoria, dataVencimento, parseInt(diasAlerta, 10), 'Pendente', req.usuario.email, nomeArquivo];
        const { rows } = await client.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao cadastrar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        await client.end();
    }
});

// Rota para atualizar um documento existente
app.put('/api/documentos/:id', verificarToken, upload.single('arquivo'), async (req, res) => {
    const client = new pg.Client(connectionConfig);
    try {
        await client.connect();
        const { id } = req.params;
        const { nome, categoria, dataVencimento, diasAlerta } = req.body; 
        
        let query;
        let values;

        if (req.file) {
            const nomeArquivo = req.file.filename;
            query = `UPDATE documentos SET nome = $1, categoria = $2, "dataVencimento" = $3, "diasAlerta" = $4, modificado_em = $5, nome_arquivo = $6
                         WHERE id = $7 RETURNING *`;
            values = [nome, categoria, dataVencimento, parseInt(diasAlerta, 10), new Date(), nomeArquivo, id];
        } else {
            query = `UPDATE documentos SET nome = $1, categoria = $2, "dataVencimento" = $3, "diasAlerta" = $4, modificado_em = $5
                         WHERE id = $6 RETURNING *`;
            values = [nome, categoria, dataVencimento, parseInt(diasAlerta, 10), new Date(), id];
        }

        const { rows } = await client.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Documento não encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        await client.end();
    }
});

// Rota para registrar novo usuário
app.post('/api/register', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) { return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' }); }
    const client = new pg.Client(connectionConfig);
    try {
        await client.connect();
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const query = `INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, email, nome`;
        const { rows } = await client.query(query, [nome, email, senhaHash]);
        res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: rows[0] });
    } catch (error) {
        if (error.code === '23505') { return res.status(409).json({ message: 'Este email já está cadastrado.' }); }
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        await client.end();
    }
});

// Rota para atualizar o perfil do usuário
app.put('/api/perfil', verificarToken, async (req, res) => {
    const { nome } = req.body;
    const usuarioId = req.usuario.id;
    if (!nome) { return res.status(400).json({ message: 'O nome é obrigatório.' }); }
    const client = new pg.Client(connectionConfig);
    try {
        await client.connect();
        const query = `UPDATE usuarios SET nome = $1 WHERE id = $2 RETURNING id, email, nome`;
        const { rows } = await client.query(query, [nome, usuarioId]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        await client.end();
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}.`);
});
// INÍCIO DO CÓDIGO PARA SUBSTITUIR (Arquivo completo: backend/index.js)
import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import fs from 'fs/promises';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { fileURLToPath } from 'url';

// --- IMPORTAÇÃO DOS NOVOS MÓDULOS ---
import veiculoRoutes from './routes/veiculoRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js'; // NOVO
import { verificarToken } from './middleware/authMiddleware.js'; // NOVO
import './mailer.js'; // Inicia o agendador de e-mails


// --- CONFIGURAÇÕES INICIAIS ---
const { Client } = pg; // Usado apenas nas rotas antigas. O ideal é refatorar para Pool no futuro.

const IS_LOCAL_ENV = process.env.PGHOST === 'localhost';
const connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: IS_LOCAL_ENV ? false : { rejectUnauthorized: false }
};

const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve os arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static('/var/data/uploads'));

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, '/var/data/uploads'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });


// ROTA TEMPORÁRIA E SECRETA PARA GERAR HASH - REMOVER DEPOIS DO USO
app.get('/api/gerar-hash/:senha', async (req, res) => {
    try {
        const { senha } = req.params;
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        // Retorna uma página HTML simples com o hash gerado
        res.status(200).send(`
            <h1>Hash Gerado com Sucesso!</h1>
            <p><strong>Senha:</strong> ${senha}</p>
            <p><strong>Hash bcrypt 100% compatível:</strong></p>
            <textarea rows="3" cols="70" readonly>${senhaHash}</textarea>
            <p>COPIE a linha de hash acima para usarmos no pgAdmin.</p>
        `);
    } catch (error) {
        console.error("Erro ao gerar hash:", error);
        res.status(500).json({ message: 'Erro interno ao gerar hash' });
    }
});

// --- ROTAS DA API ---

// Conecta as rotas de veículos e usuários ao servidor
app.use('/api', veiculoRoutes);
app.use('/api', usuarioRoutes); // NOVO


// Rota de Login (não precisa de token)
app.post('/api/login', async (req, res) => {
    console.log('--- DADOS RECEBIDOS NA TENTATIVA DE LOGIN: ---', req.body); // <<< ADICIONE ESTA LINHA
    const { email, senha } = req.body;
    const client = new pg.Client(connectionConfig);
    try {
        await client.connect();
        const resultado = await client.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (resultado.rowCount === 0) { return res.status(400).json({ message: 'Email ou senha inválidos.' }); }
        
        const usuario = resultado.rows[0];
        
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) { return res.status(400).json({ message: 'Email ou senha inválidos.' }); }
        
        const tokenPayload = { id: usuario.id, email: usuario.email, nome: usuario.nome, role: usuario.role };
        const usuarioInfo = { id: usuario.id, email: usuario.email, nome: usuario.nome, role: usuario.role };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '8h' });
        
        res.status(200).json({ token, usuario: usuarioInfo });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (client._connected) {
            await client.end();
        }
    }
});

// Rota para buscar todos os documentos (agora usa o middleware importado)
app.get('/api/documentos', verificarToken, async (req, res) => {
    const client = new Client(connectionConfig);
    try {
        await client.connect();
        const query = `SELECT doc.*, u.nome as criado_por_nome FROM documentos doc LEFT JOIN usuarios u ON doc.criado_por_email = u.email ORDER BY doc."dataVencimento" ASC`;
        const { rows } = await client.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        if (client._connected) { await client.end(); }
    }
});

// Rota para criar um novo documento
app.post('/api/documentos', verificarToken, upload.single('arquivo'), async (req, res) => {
    const client = new Client(connectionConfig);
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
        if (client._connected) { await client.end(); }
    }
});

// Rota para atualizar um documento
app.put('/api/documentos/:id', verificarToken, upload.single('arquivo'), async (req, res) => {
    const client = new Client(connectionConfig);
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
        if (client._connected) { await client.end(); }
    }
});

// Rota para deletar um documento
app.delete('/api/documentos/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const client = new pg.Client(connectionConfig);

    try {
        await client.connect();

        const selectQuery = 'SELECT nome_arquivo FROM documentos WHERE id = $1';
        const selectResult = await client.query(selectQuery, [id]);

        if (selectResult.rowCount === 0) {
            await client.end();
            return res.status(404).json({ message: 'Documento não encontrado.' });
        }
        const nomeArquivo = selectResult.rows[0].nome_arquivo;

        const deleteQuery = 'DELETE FROM documentos WHERE id = $1';
        await client.query(deleteQuery, [id]);

        if (nomeArquivo) {
            const caminhoArquivo = path.join('/var/data/uploads', nomeArquivo);
            try {
                await fs.unlink(caminhoArquivo);
                console.log(`Arquivo físico deletado: ${caminhoArquivo}`);
            } catch (fileError) {
                console.error(`Aviso: Falha ao deletar o arquivo físico ${caminhoArquivo}:`, fileError.message);
            }
        }

        res.status(200).json({ message: 'Documento deletado com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (client._connected) {
            await client.end();
        }
    }
});

// Rota para registrar novo usuário (agora usa o middleware importado)
app.post('/api/register', verificarToken, async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) { return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' }); }
    const client = new Client(connectionConfig);
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
        if (client._connected) { await client.end(); }
    }
});

// Rota para atualizar o perfil do usuário
app.put('/api/perfil', verificarToken, async (req, res) => {
    const { nome } = req.body;
    const usuarioId = req.usuario.id;
    if (!nome) { return res.status(400).json({ message: 'O nome é obrigatório.' }); }
    const client = new Client(connectionConfig);
    try {
        await client.connect();
        const query = `UPDATE usuarios SET nome = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, nome, role`;
        const { rows } = await client.query(query, [nome, usuarioId]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (client._connected) { await client.end(); }
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}.`);
});
// FIM DO CÓDIGO PARA SUBSTITUIR
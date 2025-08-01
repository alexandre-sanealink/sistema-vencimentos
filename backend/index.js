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


// ROTA DE SETUP (COMENTADA PARA SEGURANÇA, JÁ USAMOS)
/*
app.get('/api/setup-inicial', async (req, res) => {
    // ... código do setup ...
});
*/


// --- NOVA ROTA DE LOGIN ---
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        // 1. Encontra o usuário pelo email
        const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (resultado.rowCount === 0) {
            return res.status(400).json({ message: 'Email ou senha inválidos.' });
        }
        const usuario = resultado.rows[0];

        // 2. Compara a senha enviada com a senha criptografada no banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
            return res.status(400).json({ message: 'Email ou senha inválidos.' });
        }

        // 3. Se a senha estiver correta, gera o "crachá de acesso" (Token JWT)
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email }, // Informações que guardamos no crachá
            process.env.JWT_SECRET, // A frase secreta que configuramos no Render
            { expiresIn: '8h' } // Validade do crachá
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});


// --- NOVO MIDDLEWARE DE SEGURANÇA ---
// Este é o "segurança" que ficará na porta das rotas de documentos
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (!token) {
        return res.sendStatus(401); // 401 Unauthorized - Não autorizado (faltou o crachá)
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) {
            return res.sendStatus(403); // 403 Forbidden - Proibido (crachá inválido/expirado)
        }
        req.usuario = usuario; // Anexa os dados do usuário na requisição
        next(); // Deixa a requisição prosseguir para a rota final
    });
};


// --- ROTAS DE DOCUMENTOS (AGORA PROTEGIDAS E COM AUDITORIA) ---

// Para buscar, precisa do crachá (verificarToken)
app.get('/api/documentos', verificarToken, async (req, res) => {
    try {
        // A query não muda, pois todos veem todos os documentos
        const { rows } = await pool.query('SELECT * FROM documentos ORDER BY "dataVencimento" ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Para cadastrar, precisa do crachá e registra o email do usuário
app.post('/api/documentos', verificarToken, async (req, res) => {
    try {
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;
        
        const query = `INSERT INTO documentos (id, nome, categoria, "dataVencimento", "diasAlerta", status, criado_por_email)
                       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const values = [
            Date.now(),
            nome,
            categoria,
            dataVencimento,
            parseInt(diasAlerta, 10),
            'Pendente',
            req.usuario.email // <-- AUDITORIA: Pega o email do "crachá"
        ];
        
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao cadastrar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Para editar, precisa do crachá e registra a data da modificação
app.put('/api/documentos/:id', verificarToken, async (req, res) => {
    try {
        const idDocumento = parseInt(req.params.id, 10);
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;

        const query = `UPDATE documentos 
                       SET nome = $1, categoria = $2, "dataVencimento" = $3, "diasAlerta" = $4, modificado_em = $5
                       WHERE id = $6 RETURNING *`;
        const values = [
            nome,
            categoria,
            dataVencimento,
            parseInt(diasAlerta, 10),
            new Date(), // <-- AUDITORIA: Pega a data/hora atual
            idDocumento
        ];

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
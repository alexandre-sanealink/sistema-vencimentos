// VERSÃO FINAL COM BANCO DE DADOS E CRIAÇÃO AUTOMÁTICA DE TABELA
import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import './mailer.js';
import pg from 'pg';

// --- CONFIGURAÇÃO DA CONEXÃO COM O BANCO DE DADOS ---
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- NOVA ROTINA: CRIA A TABELA SE ELA NÃO EXISTIR ---
const inicializarBancoDeDados = async () => {
    const queryCreateTable = `
    CREATE TABLE IF NOT EXISTS documentos (
        id BIGINT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        categoria VARCHAR(100),
        "dataVencimento" DATE,
        "diasAlerta" INTEGER,
        status VARCHAR(50)
    );
    `;
    try {
        await pool.query(queryCreateTable);
        console.log("✅ Tabela 'documentos' verificada/criada com sucesso.");
    } catch (error) {
        console.error("❌ Erro ao criar a tabela 'documentos':", error);
        // Em um cenário real, poderíamos querer que a aplicação pare se o BD falhar.
        // Por enquanto, apenas logamos o erro.
    }
};

// Chamamos a função para garantir que o BD esteja pronto antes de iniciar o servidor
inicializarBancoDeDados();


const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(process.cwd(), '../frontend')));

// --- ROTAS DA API (sem alterações) ---

app.get('/api/documentos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM documentos ORDER BY "dataVencimento" ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.post('/api/documentos', async (req, res) => {
    const { nome, categoria, dataVencimento, diasAlerta } = req.body;
    const novoDocumento = {
        id: Date.now(),
        status: 'Pendente',
        nome, categoria, dataVencimento, diasAlerta
    };
    try {
        const query = `INSERT INTO documentos (id, nome, categoria, "dataVencimento", "diasAlerta", status)
                       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
        const values = [novoDocumento.id, novoDocumento.nome, novoDocumento.categoria, novoDocumento.dataVencimento, novoDocumento.diasAlerta, novoDocumento.status];
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao cadastrar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.put('/api/documentos/:id', async (req, res) => {
    const idDocumento = req.params.id;
    const { nome, categoria, dataVencimento, diasAlerta } = req.body;
    try {
        const query = `UPDATE documentos SET nome = $1, categoria = $2, "dataVencimento" = $3, "diasAlerta" = $4
                       WHERE id = $5 RETURNING *`;
        const values = [nome, categoria, dataVencimento, diasAlerta, idDocumento];
        const { rows } = await pool.query(query, values);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

const PORTA = process.env.PORT || 3000;
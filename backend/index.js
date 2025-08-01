import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import './mailer.js';
import pg from 'pg';
// NOVAS IMPORTAÇÕES DE SEGURANÇA
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


// --- ROTA DE SETUP TEMPORÁRIA ---
// ESTA ROTA SERÁ USADA APENAS UMA VEZ PARA CONFIGURAR O BANCO DE DADOS
app.get('/api/setup-inicial', async (req, res) => {
    try {
        // Comando para criar a tabela de usuários
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                senha_hash VARCHAR(255) NOT NULL
            );
        `);

        // Comando para alterar a tabela de documentos
        // Usamos 'ALTER TABLE ... ADD COLUMN IF NOT EXISTS' mas o Postgre não suporta nativamente,
        // então vamos checar se a coluna existe de outra forma
        const colunas = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='documentos' and column_name='criado_por_email'
        `);
        if (colunas.rowCount === 0) {
            await pool.query(`
                ALTER TABLE documentos
                ADD COLUMN criado_por_email VARCHAR(255),
                ADD COLUMN modificado_em TIMESTAMP;
            `);
        }
        
        // Criptografa uma senha padrão para o primeiro usuário
        // A senha padrão será 'mudar123'
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash('mudar123', salt);

        // Insere o usuário administrador (SE ELE NÃO EXISTIR)
        await pool.query(`
            INSERT INTO usuarios (email, senha_hash)
            VALUES ('alexandre.bwsweb@gmail.com', $1)
            ON CONFLICT (email) DO NOTHING;
        `, [senhaHash]);

        res.status(200).send('✅ Setup do banco de dados concluído com sucesso! Tabelas criadas e usuário administrador inserido com a senha padrão "mudar123".');
    } catch (error) {
        console.error("❌ Erro no setup inicial:", error);
        res.status(500).send('Erro durante o setup do banco de dados.');
    }
});


// --- ROTAS DA APLICAÇÃO (sem alterações por enquanto) ---
// (Omiti o restante do código das rotas GET, POST, PUT para ser breve, mantenha o seu como estava)
// #region ROTAS
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
    try {
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;
        const novoDocumento = {
            id: Date.now(),
            status: 'Pendente',
            nome,
            categoria,
            diasAlerta: parseInt(diasAlerta, 10),
            dataVencimento
        };
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
    try {
        const idDocumento = parseInt(req.params.id, 10);
        const { nome, categoria, dataVencimento, diasAlerta } = req.body;
        const query = `UPDATE documentos SET nome = $1, categoria = $2, "dataVencimento" = $3, "diasAlerta" = $4
                       WHERE id = $5 RETURNING *`;
        const values = [nome, categoria, dataVencimento, parseInt(diasAlerta, 10), idDocumento];
        const { rows } = await pool.query(query, values);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
// #endregion

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}.`);
});
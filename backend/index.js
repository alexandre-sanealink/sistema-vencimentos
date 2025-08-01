// VERSÃO SEM UPLOAD
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import './mailer.js';

const DB_PATH = './database.json';

const app = express();
app.use(express.json());
app.use(cors());

// Serve os arquivos estáticos da pasta frontend
app.use(express.static(path.join(process.cwd(), '../frontend')));

const lerDados = async () => {
    try {
        const dados = await fs.readFile(DB_PATH, 'utf-8');
        if (!dados) return [];
        return JSON.parse(dados);
    } catch (error) { return []; }
};

const escreverDados = async (dados) => {
    await fs.writeFile(DB_PATH, JSON.stringify(dados, null, 2));
};

app.get('/api/documentos', async (req, res) => {
    const documentos = await lerDados();
    res.status(200).json(documentos);
});

app.post('/api/documentos', async (req, res) => {
    const novoDocumento = req.body;
    novoDocumento.id = Date.now();
    novoDocumento.status = 'Pendente';
    const documentos = await lerDados();
    documentos.push(novoDocumento);
    await escreverDados(documentos);
    res.status(201).json(novoDocumento);
});

app.put('/api/documentos/:id', async (req, res) => {
    const idDocumento = parseInt(req.params.id);
    const dadosAtualizados = req.body;
    const documentos = await lerDados();
    const index = documentos.findIndex(d => d.id === idDocumento);
    if (index === -1) return res.status(404).json({ message: 'Documento não encontrado.' });
    documentos[index] = { ...documentos[index], ...dadosAtualizados };
    await escreverDados(documentos);
    res.status(200).json(documentos[index]);
});

const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}.`);
});
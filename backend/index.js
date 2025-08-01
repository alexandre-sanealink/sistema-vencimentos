// PASSO 1: IMPORTAR AS "PEÇAS"
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import './mailer.js';

// --- IMPORTAÇÕES PARA UPLOAD ---
import multer from 'multer';
import path from 'path';

const DB_PATH = './database.json';

// --- CONFIGURAÇÃO DO MULTER ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const nomeUnico = Date.now() + '-' + file.originalname;
        cb(null, nomeUnico);
    }
});
const upload = multer({ storage: storage });

// PASSO 2: INICIALIZAR O SERVIDOR
const app = express();
app.use(express.json());
app.use(cors());

// --- TORNAR A PASTA UPLOADS ACESSÍVEL ---
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- FUNÇÕES AUXILIARES PARA O BANCO DE DADOS ---
const lerDados = async () => {
    try {
        const dados = await fs.readFile(DB_PATH, 'utf-8');
        if (!dados) return [];
        return JSON.parse(dados);
    } catch (error) {
        return [];
    }
};

const escreverDados = async (dados) => {
    await fs.writeFile(DB_PATH, JSON.stringify(dados, null, 2));
};

// --- ROTAS DA NOSSA API ---

// ROTA GET: Para buscar todos os documentos
app.get('/api/documentos', async (req, res) => {
    const documentos = await lerDados();
    res.status(200).json(documentos);
});

// ROTA POST: Para cadastrar um novo documento com arquivo
app.post('/api/documentos', upload.single('arquivo'), async (req, res) => {
    const novoDocumento = req.body;
    if (req.file) {
        novoDocumento.nomeArquivo = req.file.filename;
    }
    novoDocumento.id = Date.now();
    novoDocumento.status = 'Pendente';
    const documentos = await lerDados();
    documentos.push(novoDocumento);
    await escreverDados(documentos);
    res.status(201).json(novoDocumento);
});

// ROTA PUT (STATUS): Para atualizar apenas o status (será removida ou alterada no futuro)
app.put('/api/documentos/:id/status', async (req, res) => {
    // Esta rota pode ser unificada com a de edição completa abaixo
    const idDocumento = parseInt(req.params.id);
    const { status } = req.body;
    const documentos = await lerDados();
    const index = documentos.findIndex(d => d.id === idDocumento);
    if (index === -1) return res.status(404).json({ message: 'Documento não encontrado.' });
    documentos[index].status = status;
    await escreverDados(documentos);
    res.status(200).json(documentos[index]);
});

// --- NOVA ROTA PUT: PARA EDITAR UM DOCUMENTO COMPLETO ---
app.put('/api/documentos/:id', upload.single('arquivo'), async (req, res) => {
    const idDocumento = parseInt(req.params.id);
    const dadosAtualizados = req.body;
    
    const documentos = await lerDados();
    const index = documentos.findIndex(d => d.id === idDocumento);

    if (index === -1) {
        return res.status(404).json({ message: 'Documento não encontrado.' });
    }

    // Se um novo arquivo foi enviado, apaga o antigo e atualiza o nome
    if (req.file) {
        const arquivoAntigo = documentos[index].nomeArquivo;
        if (arquivoAntigo) {
            try {
                // Apaga o arquivo antigo para não ocupar espaço
                await fs.unlink(path.join('uploads', arquivoAntigo));
            } catch (error) {
                console.error("Erro ao deletar arquivo antigo:", error);
            }
        }
        dadosAtualizados.nomeArquivo = req.file.filename;
    }

    // Atualiza os dados do documento com os novos dados
    // O 'status' é enviado no corpo, então ele também é atualizado
    documentos[index] = { ...documentos[index], ...dadosAtualizados };

    await escreverDados(documentos);
    res.status(200).json(documentos[index]);
});


// PASSO 3: INICIAR O SERVIDOR
const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}.`);
});
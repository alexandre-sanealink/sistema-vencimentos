import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; // Necessário para lógica de upload

import {
    listarDocumentos,
    criarDocumento,
    atualizarDocumento,
    deletarDocumento,
    obterResumoDocumentos // Importa a nova função
} from '../controllers/DocumentoController.js';
// Não precisamos importar verificarToken aqui, pois será aplicado no index.js

const router = express.Router();

// --- Configuração do Multer (repetida aqui para manter o arquivo independente) ---
const __filename = fileURLToPath(import.meta.url);
// __dirname de routes é diferente do __dirname do index.js
const __dirname = path.dirname(__filename);
const IS_RENDER = 'RENDER' in process.env;
// Caminho relativo da pasta 'routes' para a pasta 'uploads' (um nível acima)
const uploadDir = IS_RENDER ? '/var/data/uploads' : path.join(__dirname, '..', 'uploads');

// Garante que o diretório local exista
if (!IS_RENDER) {
    fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });
// --- Fim Configuração Multer ---


// --- ROTAS DE DOCUMENTOS ---

// GET /api/documentos/resumo - Nova rota para o dashboard (deve vir antes de /:id)
router.get('/resumo', obterResumoDocumentos);

// GET /api/documentos - Lista todos os documentos
router.get('/', listarDocumentos);

// POST /api/documentos - Cria um novo documento (com upload de arquivo)
router.post('/', upload.single('arquivo'), criarDocumento);

// PUT /api/documentos/:id - Atualiza um documento (com upload opcional)
router.put('/:id', upload.single('arquivo'), atualizarDocumento);

// DELETE /api/documentos/:id - Deleta um documento
router.delete('/:id', deletarDocumento);


export default router;
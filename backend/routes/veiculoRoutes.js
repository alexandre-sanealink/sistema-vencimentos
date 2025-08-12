// Alterado: Usa 'import'
import express from 'express';
// Alterado: Importa as funções individualmente
import { 
    listarVeiculos, 
    obterVeiculoPorId, 
    criarVeiculo, 
    atualizarVeiculo, 
    deletarVeiculo,
    listarManutencoes,
    adicionarManutencao,
    deletarManutencao, // NOVO: Importa a função de deletar manutenção
    listarAbastecimentos,
    adicionarAbastecimento,
    listarPlanosManutencao,
    adicionarPlanoManutencao,
    deletarPlanoManutencao // NOVO: Importa a função de deletar item do plano
} from '../controllers/VeiculoController.js'; // Adiciona .js no final

const router = express.Router();

// --- ROTAS DE VEÍCULOS ---
router.get('/veiculos', listarVeiculos);
router.get('/veiculos/:id', obterVeiculoPorId);
router.post('/veiculos', criarVeiculo);
router.put('/veiculos/:id', atualizarVeiculo);
router.delete('/veiculos/:id', deletarVeiculo);

// --- ROTAS DE MANUTENÇÃO ---
router.get('/veiculos/:veiculoId/manutencoes', listarManutencoes);
router.post('/veiculos/:veiculoId/manutencoes', adicionarManutencao);
// NOVO: Rota para deletar um registro de manutenção específico
router.delete('/veiculos/:veiculoId/manutencoes/:manutencaoId', deletarManutencao);

// --- ROTAS DE ABASTECIMENTO ---
router.get('/veiculos/:veiculoId/abastecimentos', listarAbastecimentos);
router.post('/veiculos/:veiculoId/abastecimentos', adicionarAbastecimento);

// --- ROTAS DE PLANO DE MANUTENÇÃO ---
router.get('/veiculos/:veiculoId/planos', listarPlanosManutencao);
router.post('/veiculos/:veiculoId/planos', adicionarPlanoManutencao);
// NOVO: Rota para deletar um item do plano de manutenção
router.delete('/veiculos/:veiculoId/planos/:planoId', deletarPlanoManutencao);

// Alterado: Usa 'export default'
export default router;
// INÍCIO DO CÓDIGO PARA SUBSTITUIR (Arquivo completo: veiculoRoutes.js)
import express from 'express';
import { 
    listarVeiculos, 
    obterVeiculoPorId, 
    criarVeiculo, 
    atualizarVeiculo, 
    deletarVeiculo,
    listarManutencoes,
    adicionarManutencao,
    deletarManutencao,
    listarAbastecimentos,
    adicionarAbastecimento,
    listarPlanosManutencao,
    adicionarPlanoManutencao,
    deletarPlanoManutencao,
    criarSolicitacaoManutencao,
    listarSolicitacoesManutencao,
    // NOVO
    assumirSolicitacaoManutencao 
} from '../controllers/VeiculoController.js';

const router = express.Router();

// --- ROTAS PRINCIPAIS DE VEÍCULOS ---
router.get('/', listarVeiculos);
router.get('/:id', obterVeiculoPorId);
router.post('/', criarVeiculo);
router.put('/:id', atualizarVeiculo);
router.delete('/:id', deletarVeiculo);

// --- ROTAS DE MANUTENÇÃO ---
router.get('/:veiculoId/manutencoes', listarManutencoes);
router.post('/:veiculoId/manutencoes', adicionarManutencao);
router.delete('/:veiculoId/manutencoes/:manutencaoId', deletarManutencao);

// --- ROTAS DE ABASTECIMENTO ---
router.get('/:veiculoId/abastecimentos', listarAbastecimentos);
router.post('/:veiculoId/abastecimentos', adicionarAbastecimento);

// --- ROTAS DE PLANO DE MANUTENÇÃO ---
router.get('/:veiculoId/planos', listarPlanosManutencao);
router.post('/:veiculoId/planos', adicionarPlanoManutencao);
router.delete('/:veiculoId/planos/:planoId', deletarPlanoManutencao);

// --- ROTAS DE SOLICITAÇÕES DE MANUTENÇÃO ---
router.get('/:veiculoId/solicitacoes', listarSolicitacoesManutencao);
router.post('/:veiculoId/solicitacoes', criarSolicitacaoManutencao);

// --- NOVO: ROTA PARA O MECÂNICO ASSUMIR UMA SOLICITAÇÃO ---
// Usamos PATCH pois é uma atualização parcial no recurso
router.patch('/:veiculoId/solicitacoes/:solicitacaoId/assumir', assumirSolicitacaoManutencao);

export default router;
// FIM DO CÓDIGO PARA SUBSTITUIR
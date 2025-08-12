// Importa o framework Express para criar o roteador
const express = require('express');
// Cria um objeto de roteador
const router = express.Router();

// Importa as funções do nosso controlador de veículos
const veiculoController = require('../controllers/VeiculoController');

// --- ROTAS DE VEÍCULOS ---

// Rota para LISTAR (GET) todos os veículos
router.get('/veiculos', veiculoController.listarVeiculos);

// Rota para OBTER (GET) um veículo específico pelo ID
router.get('/veiculos/:id', veiculoController.obterVeiculoPorId);

// Rota para CRIAR (POST) um novo veículo
router.post('/veiculos', veiculoController.criarVeiculo);

// Rota para ATUALIZAR (PUT) um veículo existente pelo ID
router.put('/veiculos/:id', veiculoController.atualizarVeiculo);

// Rota para DELETAR (DELETE) um veículo pelo ID
router.delete('/veiculos/:id', veiculoController.deletarVeiculo);


// --- NOVAS ROTAS DE MANUTENÇÃO (ANINHADAS EM VEÍCULOS) ---

// Rota para LISTAR (GET) todas as manutenções de um veículo específico
router.get('/veiculos/:veiculoId/manutencoes', veiculoController.listarManutencoes);

// Rota para ADICIONAR (POST) uma nova manutenção a um veículo específico
router.post('/veiculos/:veiculoId/manutencoes', veiculoController.adicionarManutencao);

// --- NOVAS ROTAS DE ABASTECIMENTO (ANINHADAS EM VEÍCULOS) ---

// Rota para LISTAR (GET) todos os abastecimentos de um veículo específico
router.get('/veiculos/:veiculoId/abastecimentos', veiculoController.listarAbastecimentos);

// Rota para ADICIONAR (POST) um novo abastecimento a um veículo específico
router.post('/veiculos/:veiculoId/abastecimentos', veiculoController.adicionarAbastecimento);

// --- NOVAS ROTAS DE PLANO DE MANUTENÇÃO (ANINHADAS EM VEÍCULOS) ---

// Rota para LISTAR (GET) todos os itens do plano de um veículo
router.get('/veiculos/:veiculoId/planos', veiculoController.listarPlanosManutencao);

// Rota para ADICIONAR (POST) um novo item ao plano de um veículo
router.post('/veiculos/:veiculoId/planos', veiculoController.adicionarPlanoManutencao);

// Exporta o roteador para que o aplicativo principal possa usá-lo
module.exports = router;
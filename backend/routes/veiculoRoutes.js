// Importa o framework Express para criar o roteador
const express = require('express');
// Cria um objeto de roteador
const router = express.Router();

// Importa as funções do nosso controlador de veículos
const veiculoController = require('../controllers/VeiculoController');

// --- DEFINIÇÃO DAS ROTAS ---

// Rota para LISTAR (GET) todos os veículos
// Acessível em http://seusite.com/api/veiculos
router.get('/veiculos', veiculoController.listarVeiculos);

// Rota para CRIAR (POST) um novo veículo
// Acessível em http://seusite.com/api/veiculos
router.post('/veiculos', veiculoController.criarVeiculo);

// --- NOVAS ROTAS ---

// Rota para ATUALIZAR (PUT) um veículo existente pelo ID
// Acessível em http://seusite.com/api/veiculos/123
router.put('/veiculos/:id', veiculoController.atualizarVeiculo);

// Rota para DELETAR (DELETE) um veículo pelo ID
// Acessível em http://seusite.com/api/veiculos/123
router.delete('/veiculos/:id', veiculoController.deletarVeiculo);


// Exporta o roteador para que o aplicativo principal possa usá-lo
module.exports = router;
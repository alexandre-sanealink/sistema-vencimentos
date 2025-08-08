// Importa a biblioteca do PostgreSQL
const { Pool } = require('pg');

// Configura a conexão com o banco de dados usando a URL que está no arquivo .env
// É seguro deixar assim, pois o Render injetará a variável de ambiente correta.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// --- FUNÇÕES DO CONTROLADOR ---

// Função para LISTAR todos os veículos
const listarVeiculos = async (req, res) => {
  try {
    // Executa a query SQL para selecionar todos os veículos, ordenados por ID
    const { rows } = await pool.query('SELECT * FROM veiculos ORDER BY id ASC');
    // Retorna a lista de veículos como resposta em formato JSON
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Função para CRIAR um novo veículo
const criarVeiculo = async (req, res) => {
  // Pega os dados enviados na requisição (vindos do formulário do frontend)
  const { placa, marca, modelo, ano, tipo } = req.body;

  // Validação simples para ver se os campos obrigatórios foram enviados
  if (!placa || !marca || !modelo || !ano || !tipo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    // A query SQL para inserir um novo veículo na tabela
    const query = `
      INSERT INTO veiculos (placa, marca, modelo, ano, tipo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *;
    `;
    // Os valores a serem inseridos, na ordem correta ($1, $2, etc.)
    const values = [placa, marca, modelo, ano, tipo];

    // Executa a query
    const { rows } = await pool.query(query, values);
    
    // Retorna o veículo que foi acabado de criar
    res.status(201).json(rows[0]);

  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    // Verifica se o erro é de placa duplicada
    if (error.code === '23505') { // Código de erro do PostgreSQL para violação de constraint unique
      return res.status(409).json({ error: 'A placa informada já está cadastrada.' });
    }
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Exporta as funções para que possam ser usadas em outros arquivos (nas rotas)
module.exports = {
  listarVeiculos,
  criarVeiculo,
};
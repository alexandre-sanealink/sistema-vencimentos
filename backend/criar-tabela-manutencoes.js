// Importa as bibliotecas necessárias
require('dotenv').config();
const { Client } = require('pg');

// O comando SQL para criar a nova tabela de manutenções
const createTableQuery = `
CREATE TABLE manutencoes (
    id SERIAL PRIMARY KEY,
    veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo VARCHAR(255) NOT NULL,
    pecas TEXT,
    tempo_gasto VARCHAR(255),
    eficiencia VARCHAR(255),
    km_atual INTEGER NOT NULL,
    proxima_manutencao_data DATE,
    proxima_manutencao_km INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
`;

// Função principal que conecta e cria a tabela
async function criarTabela() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } 
  });

  try {
    console.log('Iniciando script...');
    console.log('Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conexão bem-sucedida!');

    console.log('Executando comando para criar a tabela "manutencoes"...');
    await client.query(createTableQuery);
    console.log('✅ SUCESSO! A tabela "manutencoes" foi criada no seu banco de dados.');

  } catch (error) {
    // Verifica se o erro é "tabela já existe"
    if (error.code === '42P07') {
      console.log('⚠️ AVISO: A tabela "manutencoes" já existe. Nenhuma alteração foi feita.');
    } else {
      console.error('❌ ERRO: Algo deu errado ao tentar executar o script.');
      console.error('Detalhes do erro:', error.message);
    }
  } finally {
    // Fecha a conexão com o banco de dados
    await client.end();
    console.log('Conexão com o banco de dados fechada. Script finalizado.');
  }
}

// Roda a função
criarTabela();
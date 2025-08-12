// Alterado: Usa 'import' em vez de 'require'
import pg from 'pg';
const { Pool } = pg;

// Configura a conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// --- FUNÇÕES DO CONTROLADOR ---

// Alterado: Adicionado 'export'
export const listarVeiculos = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM veiculos ORDER BY id ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Alterado: Adicionado 'export'
export const obterVeiculoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM veiculos WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Erro ao buscar veículo com ID ${id}:`, error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Alterado: Adicionado 'export'
export const criarVeiculo = async (req, res) => {
  const { placa, marca, modelo, ano, tipo } = req.body;
  if (!placa || !marca || !modelo || !ano || !tipo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }
  try {
    const query = `
      INSERT INTO veiculos (placa, marca, modelo, ano, tipo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *;
    `;
    const values = [placa, marca, modelo, ano, tipo];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A placa informada já está cadastrada.' });
    }
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Alterado: Adicionado 'export'
export const atualizarVeiculo = async (req, res) => {
  const { id } = req.params;
  const { placa, marca, modelo, ano, tipo } = req.body;
  if (!placa || !marca || !modelo || !ano || !tipo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }
  try {
    const query = `
      UPDATE veiculos 
      SET placa = $1, marca = $2, modelo = $3, ano = $4, tipo = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    const values = [placa, marca, modelo, ano, tipo, id];
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Erro ao atualizar veículo com ID ${id}:`, error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A placa informada já está cadastrada em outro veículo.' });
    }
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Alterado: Adicionado 'export'
export const deletarVeiculo = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM veiculos WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }
    res.status(200).json({ message: 'Veículo deletado com sucesso.' });
  } catch (error) {
    console.error(`Erro ao deletar veículo com ID ${id}:`, error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// --- FUNÇÕES DE MANUTENÇÃO ---

// Alterado: Adicionado 'export'
export const listarManutencoes = async (req, res) => {
    const { veiculoId } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM manutencoes WHERE veiculo_id = $1 ORDER BY data DESC', [veiculoId]);
        const manutencoesTratadas = rows.map(m => {
            try {
                m.pecas = m.pecas ? JSON.parse(m.pecas) : [];
            } catch (e) {
                console.error('Erro ao fazer parse do JSON de peças:', e);
                m.pecas = [];
            }
            return m;
        });
        res.status(200).json(manutencoesTratadas);
    } catch (error) {
        console.error(`Erro ao listar manutenções para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

// Alterado: Adicionado 'export'
export const adicionarManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    const { data, tipo, km_atual, pecas } = req.body;
    if (!data || !tipo || !km_atual) {
        return res.status(400).json({ error: 'Os campos data, tipo e km_atual são obrigatórios.' });
    }
    try {
        const query = `
            INSERT INTO manutencoes (veiculo_id, data, tipo, km_atual, pecas, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *;
        `;
        const pecasJSON = JSON.stringify(pecas);
        const values = [veiculoId, data, tipo, km_atual, pecasJSON];
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(`Erro ao adicionar manutenção para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

// --- FUNÇÕES DE ABASTECIMENTO ---

// Alterado: Adicionado 'export'
export const listarAbastecimentos = async (req, res) => {
    const { veiculoId } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM abastecimentos WHERE veiculo_id = $1 ORDER BY data DESC', [veiculoId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Erro ao listar abastecimentos para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

// Alterado: Adicionado 'export'
export const adicionarAbastecimento = async (req, res) => {
    const { veiculoId } = req.params;
    const { data, km_atual, litros_abastecidos, valor_total, posto } = req.body;
    if (!data || !km_atual || !litros_abastecidos) {
        return res.status(400).json({ error: 'Os campos data, km_atual e litros_abastecidos são obrigatórios.' });
    }
    try {
        const query = `
            INSERT INTO abastecimentos (veiculo_id, data, km_atual, litros_abastecidos, valor_total, posto, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *;
        `;
        const values = [veiculoId, data, km_atual, litros_abastecidos, valor_total, posto];
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(`Erro ao adicionar abastecimento para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

// --- FUNÇÕES DE PLANO DE MANUTENÇÃO ---
    
// Alterado: Adicionado 'export'
export const listarPlanosManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM planos_manutencao WHERE veiculo_id = $1 ORDER BY id ASC', [veiculoId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Erro ao listar planos para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
    
// Alterado: Adicionado 'export'
export const adicionarPlanoManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    const { descricao, intervalo_km, intervalo_meses } = req.body;
    if (!descricao || (!intervalo_km && !intervalo_meses)) {
        return res.status(400).json({ error: 'Descrição e pelo menos um intervalo (KM ou meses) são obrigatórios.' });
    }
    try {
        const query = `
            INSERT INTO planos_manutencao (veiculo_id, descricao, intervalo_km, intervalo_meses, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *;
        `;
        const values = [veiculoId, descricao, intervalo_km || null, intervalo_meses || null];
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(`Erro ao adicionar item ao plano para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
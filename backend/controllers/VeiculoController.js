// --- Conexão com o Banco de Dados ---
import pg from 'pg';
const { Pool } = pg;

const IS_LOCAL_ENV = process.env.PGHOST === 'localhost';

const pool = new Pool({
    // No Render, ele usará a DATABASE_URL. Localmente (onde DATABASE_URL não existe no .env),
    // a biblioteca 'pg' usará automaticamente as variáveis PGHOST, PGUSER, etc.
    connectionString: process.env.DATABASE_URL,

    // Ativa o SSL apenas se NÃO estivermos no ambiente local.
    ssl: IS_LOCAL_ENV ? false : { rejectUnauthorized: false }
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

// INÍCIO DO CÓDIGO PARA SUBSTITUIR
export const listarManutencoes = async (req, res) => {
    const { veiculoId } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM manutencoes WHERE veiculo_id = $1 ORDER BY data DESC', [veiculoId]);

        // CORREÇÃO FINAL: Faz o parse manual da coluna 'pecas' para cada registro.
        const manutencoesTratadas = rows.map(manutencao => {
            // Garante que o parse só aconteça se 'pecas' for uma string.
            if (typeof manutencao.pecas === 'string') {
                try {
                    // "Abre o pacote", transformando o texto em uma lista de objetos.
                    manutencao.pecas = JSON.parse(manutencao.pecas);
                } catch (e) {
                    console.error('Erro ao fazer parse do JSON de peças:', e);
                    manutencao.pecas = []; // Em caso de erro, define como lista vazia.
                }
            }
            return manutencao;
        });

        res.status(200).json(manutencoesTratadas);

    } catch (error) {
        console.error(`Erro ao listar manutenções para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
// FIM DO CÓDIGO PARA SUBSTITUIR

// INÍCIO DO CÓDIGO PARA SUBSTITUIR
export const adicionarManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    const { data, tipo, km_atual, pecas } = req.body;

    if (!data || !tipo || !km_atual) {
        return res.status(400).json({ error: 'Os campos data, tipo e km_atual são obrigatórios.' });
    }
    try {
        const query = `
            INSERT INTO manutencoes (veiculo_id, data, tipo, km_atual, pecas, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
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
// FIM DO CÓDIGO PARA SUBSTITUIR

// NOVO: Função para deletar um registro de manutenção
export const deletarManutencao = async (req, res) => {
    const { manutencaoId } = req.params;
    try {
        const query = 'DELETE FROM manutencoes WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [manutencaoId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Registro de manutenção não encontrado.' });
        }
        res.status(200).json({ message: 'Registro de manutenção deletado com sucesso.' });
    } catch (error) {
        console.error(`Erro ao deletar manutenção com ID ${manutencaoId}:`, error);
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

// INÍCIO DO CÓDIGO PARA SUBSTITUIR (listarPlanosManutencao)
export const listarPlanosManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    try {
        const kmAtualResult = await pool.query(
            `SELECT GREATEST(
                (SELECT km_atual FROM manutencoes WHERE veiculo_id = $1 ORDER BY data DESC, id DESC LIMIT 1),
                (SELECT km_atual FROM abastecimentos WHERE veiculo_id = $1 ORDER BY data DESC, id DESC LIMIT 1)
            ) as km_atual`,
            [veiculoId]
        );
        const kmAtual = kmAtualResult.rows.length > 0 && kmAtualResult.rows[0].km_atual ? parseInt(kmAtualResult.rows[0].km_atual) : 0;

        const planosResult = await pool.query('SELECT * FROM planos_manutencao WHERE veiculo_id = $1 ORDER BY id ASC', [veiculoId]);
        const planos = planosResult.rows;

        const planosComStatus = await Promise.all(planos.map(async (plano) => {
            const ultimaManutencaoResult = await pool.query(
                `SELECT data, km_atual FROM manutencoes 
                 WHERE veiculo_id = $1 AND tipo = 'Preventiva' AND pecas::text ILIKE $2 
                 ORDER BY data DESC, id DESC LIMIT 1`,
                [veiculoId, `%${plano.descricao}%`]
            );
            const ultimaManutencao = ultimaManutencaoResult.rows.length > 0 ? ultimaManutencaoResult.rows[0] : null;

            let statusKm = 'Em Dia';
            if (plano.intervalo_km && kmAtual > 0) {
                const kmBase = ultimaManutencao ? parseInt(ultimaManutencao.km_atual) : 0;
                const proximaKm = kmBase + parseInt(plano.intervalo_km);
                const kmFaltante = proximaKm - kmAtual;

                if (kmFaltante <= 0) {
                    statusKm = 'Vencido';
                } else if (kmFaltante <= (parseInt(plano.intervalo_km) * 0.15)) {
                    statusKm = 'Alerta';
                }
            }

            // --- LÓGICA DE TEMPO ATUALIZADA PARA DIAS ---
            let statusTempo = 'Em Dia';
            if (plano.intervalo_dias) {
                const dataBase = ultimaManutencao ? new Date(ultimaManutencao.data) : new Date(plano.created_at);
                const proximaData = new Date(dataBase);
                proximaData.setDate(proximaData.getDate() + parseInt(plano.intervalo_dias));
                
                const diasFaltantes = Math.ceil((proximaData.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                if (diasFaltantes <= 0) {
                    statusTempo = 'Vencido';
                } else if (diasFaltantes <= (parseInt(plano.intervalo_dias) * 0.15)) { // Alerta nos últimos 15% dos dias
                    statusTempo = 'Alerta';
                }
            }
            
            let statusFinal = 'Em Dia';
            if (statusKm === 'Alerta' || statusTempo === 'Alerta') {
                statusFinal = 'Alerta';
            }
            if (statusKm === 'Vencido' || statusTempo === 'Vencido') {
                statusFinal = 'Vencido';
            }

            return { ...plano, status: statusFinal };
        }));

        res.status(200).json(planosComStatus);

    } catch (error) {
        console.error(`Erro ao listar planos para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
// FIM DO CÓDIGO PARA SUBSTITUIR

// INÍCIO DO CÓDIGO PARA SUBSTITUIR (adicionarPlanoManutencao)
export const adicionarPlanoManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    const { descricao, intervalo_km, intervalo_dias } = req.body;
    if (!descricao || (!intervalo_km && !intervalo_dias)) {
        return res.status(400).json({ error: 'Descrição e pelo menos um intervalo (KM ou Dias) são obrigatórios.' });
    }
    try {
        const query = `
            INSERT INTO planos_manutencao (veiculo_id, descricao, intervalo_km, intervalo_dias, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *;
        `;
        const values = [veiculoId, descricao, intervalo_km || null, intervalo_dias || null];
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(`Erro ao adicionar item ao plano para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
// FIM DO CÓDIGO PARA SUBSTITUIR

// NOVO: Função para deletar um item do plano de manutenção
export const deletarPlanoManutencao = async (req, res) => {
    const { planoId } = req.params;
    try {
        const query = 'DELETE FROM planos_manutencao WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [planoId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Item do plano de manutenção não encontrado.' });
        }
        res.status(200).json({ message: 'Item do plano de manutenção deletado com sucesso.' });
    } catch (error) {
        console.error(`Erro ao deletar item do plano com ID ${planoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

// INÍCIO DO NOVO CÓDIGO (adicionar no final do VeiculoController.js)

// --- FUNÇÕES DE SOLICITAÇÕES DE MANUTENÇÃO ---

/**
 * Lista todas as solicitações de manutenção para um veículo específico.
 * Rota: GET /api/veiculos/:veiculoId/solicitacoes
 */
export const listarSolicitacoesManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    try {
        // CORREÇÃO: A query foi alterada para selecionar explicitamente todas as colunas,
        // garantindo que o campo 'status' seja sempre incluído no resultado.
        const query = `
            SELECT 
                s.id,
                s.veiculo_id,
                s.solicitado_por_id,
                s.mecanico_responsavel_id,
                s.status,
                s.data_solicitacao,
                s.descricao_problema,
                s.created_at,
                s.updated_at,
                solicitante.nome as solicitado_por_nome,
                mecanico.nome as mecanico_responsavel_nome
            FROM 
                solicitacoes_manutencao s
            LEFT JOIN 
                usuarios solicitante ON s.solicitado_por_id = solicitante.id
            LEFT JOIN 
                usuarios mecanico ON s.mecanico_responsavel_id = mecanico.id
            WHERE 
                s.veiculo_id = $1 
            ORDER BY 
                s.data_solicitacao DESC;
        `;
        const { rows } = await pool.query(query, [veiculoId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Erro ao listar solicitações para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

/**
 * Cria uma nova solicitação de manutenção para um veículo.
 * Rota: POST /api/veiculos/:veiculoId/solicitacoes
 */
export const criarSolicitacaoManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    const { descricao_problema } = req.body;
    const solicitado_por_id = req.usuario.id; // Pega o ID do usuário logado (que fez a solicitação)

    if (!descricao_problema) {
        return res.status(400).json({ error: 'A descrição do problema é obrigatória.' });
    }

    try {
        const query = `
            INSERT INTO solicitacoes_manutencao (veiculo_id, solicitado_por_id, descricao_problema)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [veiculoId, solicitado_por_id, descricao_problema];
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(`Erro ao criar solicitação para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
// FIM DO NOVO CÓDIGO

// INÍCIO DO NOVO CÓDIGO (adicionar no final do VeiculoController.js)

/**
 * Atualiza o status de uma solicitação para 'EM_ANDAMENTO' e atribui o mecânico logado.
 * Rota: PATCH /api/veiculos/:veiculoId/solicitacoes/:solicitacaoId/assumir
 */
export const assumirSolicitacaoManutencao = async (req, res) => {
    const { solicitacaoId } = req.params;
    const mecanicoId = req.usuario.id; // Pega o ID do mecânico que está logado

    try {
        const query = `
            UPDATE solicitacoes_manutencao 
            SET 
                status = 'EM_ANDAMENTO', 
                mecanico_responsavel_id = $1,
                updated_at = NOW()
            WHERE 
                id = $2 AND status = 'ABERTO'
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [mecanicoId, solicitacaoId]);

        if (rows.length === 0) {
            // Isso pode acontecer se a solicitação não foi encontrada ou se outro mecânico já assumiu.
            return res.status(404).json({ error: 'Solicitação não encontrada ou já foi assumida.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`Erro ao assumir solicitação ID ${solicitacaoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};
// FIM DO NOVO CÓDIGO
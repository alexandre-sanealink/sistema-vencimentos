// --- Conexão com o Banco de Dados ---
import pg from 'pg';
const { Pool } = pg;
import { enviarEmail } from '../mailer.js';

const IS_LOCAL_ENV = process.env.PGHOST === 'localhost';



// Arquivo: VeiculoController.js
const pool = new Pool(
    process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } 
      } 
    : {} 
);

// =================================================================
// --- NOVA FUNÇÃO AUXILIAR DE NOTIFICAÇÕES ---
// =================================================================
/**
 * Função centralizada para criar uma notificação no banco e enviar um e-mail.
 * @param {object} client - O cliente de conexão do banco para usar na transação.
 * @param {object} dados - Contém { usuarioId, mensagem, link, email, assuntoEmail, corpoEmail }.
 */
const criarNotificacaoEEnviarEmail = async (client, { usuarioId, mensagem, link, email, assuntoEmail, corpoEmail }) => {
    try {
        const queryNotificacao = `
            INSERT INTO notificacoes (usuario_id, mensagem, link) VALUES ($1, $2, $3);
        `;
        await client.query(queryNotificacao, [usuarioId, mensagem, link]);

        if (email) {
            enviarEmail(email, assuntoEmail, corpoEmail)
                .catch(err => console.error(`Falha ao enviar e-mail de notificação para ${email}:`, err));
        }
    } catch (error) {
        console.error(`Erro ao criar notificação para o usuário ${usuarioId}:`, error);
    }
};

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

// ARQUIVO: /controllers/VeiculoController.js

// SUBSTITUA a função 'adicionarManutencao' inteira por esta versão final
export const adicionarManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    // (NOVO) Recebe também o planoItemId do corpo da requisição
    const { data, tipo, km_atual, pecas, solicitacaoId, planoItemId } = req.body;

    if (!data || !tipo || !km_atual) {
        return res.status(400).json({ error: 'Os campos data, tipo e km_atual são obrigatórios.' });
    }

    // (NOVO) Validação adicional: Se for Preventiva, planoItemId é obrigatório
    if (tipo === 'Preventiva' && !planoItemId) {
         return res.status(400).json({ error: 'Para manutenção preventiva, é obrigatório selecionar o item do plano executado.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // (NOVO) A query INSERT agora inclui a coluna plano_manutencao_id
        const insertManutencaoQuery = `
            INSERT INTO manutencoes (
                veiculo_id, data, tipo, km_atual, pecas, 
                plano_manutencao_id, -- Nova coluna
                created_at, updated_at 
            )
            VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW(), NOW()) -- Adicionado $6
            RETURNING *;
        `;
        const pecasJSON = JSON.stringify(pecas || []);
        // (NOVO) O valor de planoItemId é adicionado aos 'values'. Se não for Preventiva, será null.
        const values = [
            veiculoId, 
            data, 
            tipo, 
            km_atual, 
            pecasJSON, 
            tipo === 'Preventiva' ? planoItemId : null // Só salva o ID se for Preventiva
        ]; 
        
        const { rows } = await client.query(insertManutencaoQuery, values);
        const novaManutencao = rows[0];

        // --- Lógica de finalização de solicitação e notificação (permanece a mesma) ---
        if (solicitacaoId) {
            const updateResult = await client.query("UPDATE solicitacoes_manutencao SET status = 'CONCLUIDO', updated_at = NOW() WHERE id = $1 RETURNING *", [solicitacaoId]);
            if (updateResult.rows.length > 0) {
                const solicitacaoFinalizada = updateResult.rows[0];
                const infoQuery = `
                    SELECT v.placa, v.modelo, u_solicitante.nome as solicitante_nome, u_mecanico.nome as mecanico_nome
                    FROM veiculos v JOIN usuarios u_solicitante ON u_solicitante.id = $1 LEFT JOIN usuarios u_mecanico ON u_mecanico.id = $2 WHERE v.id = $3;
                `;
                const infoResult = await client.query(infoQuery, [solicitacaoFinalizada.solicitado_por_id, solicitacaoFinalizada.mecanico_responsavel_id, veiculoId]);
                const { placa, modelo, solicitante_nome, mecanico_nome } = infoResult.rows[0];
                const queryDestinatarios = `SELECT id, email FROM usuarios WHERE role IN ('SUPER_ADMIN', 'ESCRITORIO') OR id = $1`;
                const destinatariosResult = await client.query(queryDestinatarios, [solicitacaoFinalizada.solicitado_por_id]);
                const mensagem = `O serviço no veículo ${modelo} (${placa}), solicitado por ${solicitante_nome}, foi finalizado por ${mecanico_nome || 'Mecânico'}.`;
                const link = `/veiculo/${veiculoId}`;
                for (const user of destinatariosResult.rows) {
                    await criarNotificacaoEEnviarEmail(client, {
                        usuarioId: user.id, mensagem, link, email: user.email,
                        assuntoEmail: `Serviço Finalizado: Veículo ${placa}`,
                        corpoEmail: `Olá,\n\n${mensagem}\n\nPor favor, acesse o sistema para visualizar o registro de manutenção.`
                    });
                }
            }
        }
        // --- Fim da lógica de notificação ---

        await client.query('COMMIT');
        res.status(201).json(novaManutencao);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Erro ao adicionar manutenção para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    } finally {
        client.release();
    }
};

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
/**
 * Lista todas as solicitações de manutenção para um veículo específico.
 * Rota: GET /api/veiculos/:veiculoId/solicitacoes
 */
export const listarSolicitacoesManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    try {
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
                -- ALTERAÇÃO: Adicionada condição para ocultar solicitações finalizadas
                AND s.status NOT IN ('CONCLUIDO', 'CANCELADO')
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
// SUBSTITUA a função 'criarSolicitacaoManutencao' inteira por esta
export const criarSolicitacaoManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    const { descricao_problema } = req.body;
    const solicitado_por_id = req.usuario.id;

    if (!descricao_problema) {
        return res.status(400).json({ error: 'A descrição do problema é obrigatória.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const querySolicitacao = `
            INSERT INTO solicitacoes_manutencao (veiculo_id, solicitado_por_id, descricao_problema)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const { rows } = await client.query(querySolicitacao, [veiculoId, solicitado_por_id, descricao_problema]);
        const novaSolicitacao = rows[0];

        // --- LÓGICA DE NOTIFICAÇÃO ATUALIZADA ---
        const queryInfo = `
            SELECT v.placa, v.modelo, u.nome as solicitante_nome
            FROM veiculos v, usuarios u
            WHERE v.id = $1 AND u.id = $2;
        `;
        const infoResult = await client.query(queryInfo, [veiculoId, solicitado_por_id]);
        const { placa, modelo, solicitante_nome } = infoResult.rows[0];

        // Busca MECÂNICOS, SUPER_ADMINS e ESCRITÓRIO
        const queryDestinatarios = `SELECT id, email FROM usuarios WHERE role IN ('MECANICO', 'SUPER_ADMIN', 'ESCRITORIO')`;
        const destinatariosResult = await client.query(queryDestinatarios);

        if (destinatariosResult.rows.length > 0) {
            const mensagem = `${solicitante_nome} abriu uma solicitação para o veículo ${modelo} (${placa}): "${descricao_problema}"`;
            const link = `/veiculo/${veiculoId}`;

            for (const user of destinatariosResult.rows) {
                // Não notificar a pessoa que criou a solicitação
                if (user.id !== solicitado_por_id) {
                    await criarNotificacaoEEnviarEmail(client, {
                        usuarioId: user.id,
                        mensagem: mensagem,
                        link: link,
                        email: user.email,
                        assuntoEmail: `Nova Solicitação de Serviço: Veículo ${placa}`,
                        corpoEmail: `Olá,\n\n${mensagem}\n\nPor favor, acesse o sistema para mais detalhes.`
                    });
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json(novaSolicitacao);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Erro ao criar solicitação para o veículo ID ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    } finally {
        client.release();
    }
};

// INÍCIO DO NOVO CÓDIGO (adicionar no final do VeiculoController.js)

/**
 * Atualiza o status de uma solicitação para 'EM_ANDAMENTO' e atribui o mecânico logado.
 * Rota: PATCH /api/veiculos/:veiculoId/solicitacoes/:solicitacaoId/assumir
 */
// SUBSTITUA a função 'assumirSolicitacaoManutencao' inteira por esta
export const assumirSolicitacaoManutencao = async (req, res) => {
    const { solicitacaoId } = req.params;
    const mecanicoId = req.usuario.id;
    const mecanicoNome = req.usuario.nome;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE solicitacoes_manutencao 
            SET status = 'EM_ANDAMENTO', mecanico_responsavel_id = $1, updated_at = NOW()
            WHERE id = $2 AND status = 'ABERTO'
            RETURNING *;
        `;
        const updateResult = await client.query(updateQuery, [mecanicoId, solicitacaoId]);

        if (updateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Solicitação não encontrada ou já foi assumida.' });
        }
        const solicitacaoAtualizada = updateResult.rows[0];

        // --- INÍCIO DA LÓGICA DE NOTIFICAÇÃO ---
        const infoQuery = `
            SELECT v.placa, v.modelo
            FROM veiculos v WHERE v.id = $1;
        `;
        const infoResult = await client.query(infoQuery, [solicitacaoAtualizada.veiculo_id]);
        const { placa, modelo } = infoResult.rows[0];

        // Notificar o solicitante original, SUPER_ADMINS e ESCRITÓRIO
        const queryDestinatarios = `SELECT id, email FROM usuarios WHERE role IN ('SUPER_ADMIN', 'ESCRITORIO') OR id = $1`;
        const destinatariosResult = await client.query(queryDestinatarios, [solicitacaoAtualizada.solicitado_por_id]);
        
        const mensagem = `${mecanicoNome} assumiu o serviço para o veículo ${modelo} (${placa}).`;
        const link = `/veiculo/${solicitacaoAtualizada.veiculo_id}`;

        for (const user of destinatariosResult.rows) {
            // Não notificar o próprio mecânico que assumiu
            if (user.id !== mecanicoId) {
                await criarNotificacaoEEnviarEmail(client, {
                    usuarioId: user.id,
                    mensagem: mensagem,
                    link: link,
                    email: user.email,
                    assuntoEmail: `Serviço Assumido: Veículo ${placa}`,
                    corpoEmail: `Olá,\n\n${mensagem}\n\nPor favor, acesse o sistema para mais detalhes.`
                });
            }
        }

        await client.query('COMMIT');
        res.status(200).json(solicitacaoAtualizada);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Erro ao assumir solicitação ID ${solicitacaoId}:`, error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    } finally {
        client.release();
    }
};

// =================================================================
// --- NOVA FUNÇÃO PARA O DASHBOARD (FASE 5) ---
// =================================================================
/**
 * Obtém dados resumidos sobre a frota para o dashboard.
 * Rota: GET /api/veiculos/resumo
 */
export const obterResumoFrota = async (req, res) => {
    // Garante que apenas Admin e Escritório acessem
    if (req.usuario.role !== 'SUPER_ADMIN' && req.usuario.role !== 'ESCRITORIO') {
        return res.status(403).json({ message: 'Acesso não autorizado.' });
    }

    const client = await pool.connect(); // Usaremos um cliente para múltiplas queries
    try {
        // 1. Contagem total de veículos
        const totalVeiculosResult = await client.query('SELECT COUNT(*) AS total FROM veiculos');
        const totalVeiculos = parseInt(totalVeiculosResult.rows[0].total, 10);

        // 2. Contagem de solicitações abertas (ABERTO ou EM_ANDAMENTO)
        const solicitacoesAbertasResult = await client.query(
            "SELECT COUNT(*) AS total FROM solicitacoes_manutencao WHERE status IN ('ABERTO', 'EM_ANDAMENTO')"
        );
        const solicitacoesAbertas = parseInt(solicitacoesAbertasResult.rows[0].total, 10);

        // 3. Status de Manutenção Preventiva (Esta é a parte mais complexa)
        //    Reutilizaremos a lógica de cálculo de status, mas aplicada a todos os veículos.
        let veiculosComAlerta = 0;
        let veiculosComVencido = 0;
        const veiculosComAtencao = []; // Lista para veículos com Alerta/Vencido ou Solicitação

        const todosVeiculosResult = await client.query('SELECT id, placa, modelo FROM veiculos');
        const todosVeiculos = todosVeiculosResult.rows;

        for (const veiculo of todosVeiculos) {
            let veiculoStatusManutencao = 'Em Dia'; // Status padrão
            let precisaAtencao = false;
            let motivoAtencao = '';

            // Verifica status das preventivas (lógica similar ao scheduler e listarPlanos)
            const planosResult = await client.query('SELECT * FROM planos_manutencao WHERE veiculo_id = $1 AND (intervalo_km IS NOT NULL OR intervalo_dias IS NOT NULL)', [veiculo.id]);
            const planos = planosResult.rows;

            if (planos.length > 0) {
                 const kmAtualResult = await client.query(`SELECT GREATEST((SELECT km_atual FROM manutencoes WHERE veiculo_id = $1 ORDER BY data DESC, id DESC LIMIT 1), (SELECT km_atual FROM abastecimentos WHERE veiculo_id = $1 ORDER BY data DESC, id DESC LIMIT 1)) as km_atual`, [veiculo.id]);
                 const kmAtual = kmAtualResult.rows.length > 0 && kmAtualResult.rows[0].km_atual ? parseInt(kmAtualResult.rows[0].km_atual) : 0;

                 for (const plano of planos) {
                    const ultimaManutencaoResult = await client.query(`SELECT data, km_atual FROM manutencoes WHERE veiculo_id = $1 AND tipo = 'Preventiva' AND (plano_manutencao_id = $2 OR pecas::text ILIKE $3) ORDER BY data DESC, id DESC LIMIT 1`, [veiculo.id, plano.id, `%${plano.descricao}%`]); // Usa ID se disponível, senão busca por texto
                    const ultimaManutencao = ultimaManutencaoResult.rows.length > 0 ? ultimaManutencaoResult.rows[0] : null;

                    let statusKm = 'Em Dia';
                    if (plano.intervalo_km && kmAtual > 0) { /* ... lógica km ... */ 
                        const kmBase = ultimaManutencao ? parseInt(ultimaManutencao.km_atual) : 0;
                        const proximaKm = kmBase + parseInt(plano.intervalo_km);
                        const kmFaltante = proximaKm - kmAtual;
                        if (kmFaltante <= 0) statusKm = 'Vencido';
                        else if (kmFaltante <= (parseInt(plano.intervalo_km) * 0.15)) statusKm = 'Alerta';
                    }
                    let statusTempo = 'Em Dia';
                    if (plano.intervalo_dias) { /* ... lógica tempo ... */ 
                        const dataBase = ultimaManutencao ? new Date(ultimaManutencao.data) : new Date(plano.created_at);
                        const proximaData = new Date(dataBase);
                        proximaData.setDate(proximaData.getDate() + parseInt(plano.intervalo_dias));
                        const diasFaltantes = Math.ceil((proximaData.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        if (diasFaltantes <= 0) statusTempo = 'Vencido';
                        else if (diasFaltantes <= (parseInt(plano.intervalo_dias) * 0.15)) statusTempo = 'Alerta';
                    }
                    
                    if (statusKm === 'Vencido' || statusTempo === 'Vencido') {
                        veiculoStatusManutencao = 'Vencido';
                        break; // Se um item está vencido, o veículo todo está com status Vencido
                    }
                    if (statusKm === 'Alerta' || statusTempo === 'Alerta') {
                        veiculoStatusManutencao = 'Alerta'; // Se não há Vencido, mas há Alerta
                    }
                 }
            }

            // Atualiza contadores e define motivo de atenção
            if (veiculoStatusManutencao === 'Vencido') {
                veiculosComVencido++;
                precisaAtencao = true;
                motivoAtencao = 'Manutenção Vencida';
            } else if (veiculoStatusManutencao === 'Alerta') {
                veiculosComAlerta++;
                precisaAtencao = true;
                motivoAtencao = 'Manutenção em Alerta';
            }

            // Verifica se há solicitações abertas para este veículo
            const solicitacaoVeiculoResult = await client.query(
                "SELECT id FROM solicitacoes_manutencao WHERE veiculo_id = $1 AND status IN ('ABERTO', 'EM_ANDAMENTO') LIMIT 1",
                [veiculo.id]
            );
            if (solicitacaoVeiculoResult.rows.length > 0) {
                precisaAtencao = true;
                // Prioriza o status de manutenção se já for Alerta/Vencido
                motivoAtencao = motivoAtencao || 'Solicitação Aberta'; 
            }

            // Adiciona à lista de atenção se necessário
            if (precisaAtencao && veiculosComAtencao.length < 5) { // Limita a 5 para não sobrecarregar
                veiculosComAtencao.push({
                    id: veiculo.id,
                    placa: veiculo.placa,
                    modelo: veiculo.modelo,
                    status: motivoAtencao
                });
            }
        } // Fim do loop for (const veiculo...)

        // Monta o objeto de resposta
        const resumo = {
            totalVeiculos: totalVeiculos,
            manutencaoAlerta: veiculosComAlerta,
            manutencaoVencida: veiculosComVencido,
            solicitacoesAbertas: solicitacoesAbertas,
            veiculosComAtencao: veiculosComAtencao
        };

        res.status(200).json(resumo);

    } catch (error) {
        console.error('Erro ao obter resumo da frota:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
};
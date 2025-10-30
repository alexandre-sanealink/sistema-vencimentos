// --- Conexão com o Banco de Dados ---
import pg from 'pg';       // <-- Ensure this line exists
const { Pool } = pg;       // <-- Ensure this line exists
import { enviarEmail } from '../mailer.js';
import PDFDocument from 'pdfkit'; 
import fs from 'fs'; 
import path from 'path'; 
import { fileURLToPath } from 'url';


const IS_LOCAL_ENV = process.env.PGHOST === 'localhost';


// Arquivo: VeiculoController.js
const pool = new Pool( // <--- This line caused the error if Pool wasn't defined above
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

// SUBSTITUA a função 'adicionarManutencao' inteira por esta versão
// SUBSTITUA adicionarManutencao NOVAMENTE por esta versão
export const adicionarManutencao = async (req, res) => {
    const { veiculoId } = req.params;
    const { data, tipo, km_atual, pecas, solicitacaoId, planoItemId } = req.body; // solicitacaoId já era recebido

    // ... (validações como antes) ...
     if (!data || !tipo || !km_atual) { /* ... */ return res.status(400).json({ error: '...' }); }
     if (tipo === 'Preventiva' && !planoItemId) { /* ... */ return res.status(400).json({ error: '...' }); }


    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const insertManutencaoQuery = `
            INSERT INTO manutencoes (
                veiculo_id, data, tipo, km_atual, pecas, 
                plano_manutencao_id, 
                solicitacao_id, -- ✅ NOVA COLUNA SENDO PREENCHIDA
                created_at, updated_at 
            )
            VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, NOW(), NOW()) -- ✅ Adicionado $7
            RETURNING *; 
        `;
        const pecasJSON = JSON.stringify(pecas || []);
        const values = [
            veiculoId, 
            data, 
            tipo, 
            km_atual, 
            pecasJSON, 
            tipo === 'Preventiva' ? planoItemId : null,
            solicitacaoId || null // ✅ Salva o ID da solicitação, ou null se não houver
        ]; 

        const { rows } = await client.query(insertManutencaoQuery, values);
        const novaManutencao = rows[0];

        // --- Lógica de finalização de solicitação e notificação (permanece a mesma) ---
        if (solicitacaoId) {
             const updateResult = await client.query("UPDATE solicitacoes_manutencao SET status = 'CONCLUIDO', updated_at = NOW() WHERE id = $1 RETURNING *", [solicitacaoId]);
             // ... (resto da lógica de notificação como antes, usando novaManutencao.numero_os) ...
             if (updateResult.rows.length > 0) { /* ... notificação ... */ }
        }
        // --- Fim da lógica de notificação ---

        await client.query('COMMIT');
        res.status(201).json(novaManutencao);
    } catch (error) {
        // ... (tratamento de erro como antes) ...
        await client.query('ROLLBACK');
        console.error(`Erro ao adicionar manutenção para o veículo ID ${veiculoId}:`, error);
        if (error.code === '23505' && error.constraint === 'manutencoes_numero_os_key') { /* ... */ } 
        else { res.status(500).json({ error: 'Erro interno no servidor' }); }

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

export const gerarPdfOrdemServico = async (req, res) => {
    const { manutencaoId } = req.params;
    const allowedRoles = ['SUPER_ADMIN', 'ESCRITORIO', 'MECANICO', 'ENCARREGADO'];
    if (!allowedRoles.includes(req.usuario.role)) { /* ... erro 403 ... */ }

    const client = await pool.connect();
    try {
        // --- Busca no Banco --- (Query Aprimorada como antes)
        const query = `
            SELECT 
                m.id, m.numero_os, m.data, m.tipo, m.km_atual, m.pecas, m.created_at as data_finalizacao, m.solicitacao_id,
                v.placa, v.marca, v.modelo, v.ano, v.tipo as tipo_veiculo,
                sm.data_solicitacao, 
                solicitante.nome as solicitante_nome, 
                mecanico.nome as mecanico_nome 
            FROM manutencoes m
            JOIN veiculos v ON m.veiculo_id = v.id
            LEFT JOIN solicitacoes_manutencao sm ON m.solicitacao_id = sm.id 
            LEFT JOIN usuarios solicitante ON sm.solicitado_por_id = solicitante.id 
            LEFT JOIN usuarios mecanico ON sm.mecanico_responsavel_id = mecanico.id 
            WHERE m.id = $1; 
        `;
        const result = await client.query(query, [manutencaoId]);
        if (result.rows.length === 0) { return res.status(404).json({ error: 'Registro não encontrado.' }); }
        const manutencao = result.rows[0];

        // ==========================================================
// --- CORREÇÃO BUG PDF RENDER (Parse de String JSON) ---
// ==========================================================
if (typeof manutencao.pecas === 'string') {
    try {
        // Log para confirmar que a correção está rodando no Render
        console.log("PDF: Detectado 'pecas' como string, fazendo parse..."); 
        manutencao.pecas = JSON.parse(manutencao.pecas);
    } catch (e) {
        console.error('PDF: Erro ao fazer parse do JSON de peças:', e);
        manutencao.pecas = []; // Define como array vazio em caso de erro
    }
}
// ==========================================================

        // --- GERAÇÃO DO PDF ---
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 20, bottom: 50, left: 50, right: 50 }, // Margens aumentadas
            bufferPages: true
        });

        const dataObj = new Date(manutencao.data);
            const dia = String(dataObj.getUTCDate()).padStart(2, '0');
            const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0'); // +1 pois meses são 0-11
            const ano = dataObj.getUTCFullYear();
            const dataFormatada = `${dia}.${mes}.${ano}`; // 21.10.2025

            // Limpa a placa (remove espaços ou barras)
            const placaLimpa = manutencao.placa.replace(/[\s\/]+/g, '');
            const osNum = `OS-${String(manutencao.numero_os).padStart(6, '0')}`;

            // Nova Nomenclatura: OS-000017-QWY8D03-21.10.2025.pdf
            const filename = `${osNum}-${placaLimpa}-${dataFormatada}.pdf`;
            console.log("Gerando OS com nome de arquivo:", filename); // <-- ADICIONE ESTE LOG
            // --- Fim do Novo Bloco ---
        res.setHeader('Content-disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        // --- DEFINIR CAMINHOS ---
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        // --- CONSTANTES DE LAYOUT ---
        const pageMarginLeft = doc.page.margins.left;
        const pageMarginRight = doc.page.margins.right;
        const pageWidth = doc.page.width - pageMarginLeft - pageMarginRight;
        const col1X = pageMarginLeft;
        const colWidth = (pageWidth / 2) - 15; // Largura da coluna (-15 de espaço entre)
        const col2X = pageMarginLeft + colWidth + 30; // Início da Coluna 2 (+30 de espaço)


        
        // --- CABEÇALHO ---
        const headerStartY = doc.page.margins.top;

        
        // --- LOGO ---
        const logoPath = path.join(__dirname, '..', 'assets', 'logo_FOCO_PNG.png'); // CONFIRME O NOME!
        const logoWidth = 120; // ✅ LOGO MAIOR
        let logoHeight = 50; // Altura estimada, será recalculada se a imagem carregar
        try {
            if (fs.existsSync(logoPath)) {
                 // Calcula proporção para ajustar altura se necessário
                 const img = doc.openImage(logoPath);
                 logoHeight = (img.height * logoWidth) / img.width; 
                 doc.image(logoPath, pageMarginLeft, headerStartY, { width: logoWidth });
            } else { console.warn(`Logo não encontrada: ${logoPath}`); }
        } catch (imgErr) { console.error("Erro logo:", imgErr); }
        // --- FIM LOGO ---
        
        // Nome da Empresa (Direita, alinhado verticalmente pelo CENTRO da logo)
        const companyNameY = headerStartY + (logoHeight / 2) - 8; // Ajuste fino (-8) para alinhar melhor o texto
        doc.fontSize(11).font('Helvetica-Bold')
           .text('Foco Soluções Ambientais e Serviços LTDA', col2X, companyNameY, { // Usando col2X para alinhar
               width: colWidth, // Largura da coluna da direita
               align: 'left' // Alinha à esquerda na coluna da direita
           });

        // Título "ORDEM DE SERVIÇO" (Abaixo, centralizado na página)
        const titleY = headerStartY + logoHeight + 5; // ✅ MAIS ESPAÇO ABAIXO
        doc.fontSize(18).font('Helvetica-Bold') // Tamanho maior para o título
           .text('ORDEM DE SERVIÇO', pageMarginLeft, titleY, { align: 'center'}); 
        doc.y = titleY + 40; // Define posição Y após o título com espaço

        // Nº OS e Data Serviço (Linha abaixo do título)
        const osY = doc.y; 
        doc.fontSize(10).font('Helvetica-Bold').text('Número OS:', pageMarginLeft, osY);
        doc.font('Helvetica').text(`OS-${String(manutencao.numero_os).padStart(6, '0')}`, pageMarginLeft + 60, osY); // Aumenta espaço
        const dataServicoTexto = `Data Serviço: ${new Date(manutencao.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
        doc.text(dataServicoTexto, pageMarginLeft, osY, { width: pageWidth, align: 'right' });
        doc.moveDown(1); // ✅ MAIS ESPAÇAMENTO

        // Linha Separadora
        doc.moveTo(pageMarginLeft, doc.y).lineTo(pageMarginLeft + pageWidth, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(3);

        // --- FUNÇÃO AUXILIAR PARA DESENHAR LINHA COM RÓTULO EM NEGRITO ---
        const drawField = (label, value, x, y, colW) => {
            doc.font('Helvetica-Bold').text(label + ':', x, y, { continued: true, width: colW });
            doc.font('Helvetica').text(` ${value || '-'}`); // Adiciona espaço e usa '-' se valor for nulo/vazio
            return doc.heightOfString(`${label}: ${value || '-'}`, { width: colW }); // Retorna altura
        };

        // --- DADOS DO VEÍCULO (2 Colunas Refinadas) ---
        doc.fontSize(11).font('Helvetica-Bold').text('Dados do Veículo', { align: 'left', underline: true }); // Título à esquerda
        doc.moveDown(0.7);
        doc.fontSize(9);
        let currentY = doc.y;
        let col1Height = 0;
        let col2Height = 0;

        // Coluna 1
        col1Height += drawField('Placa', manutencao.placa, col1X, currentY + col1Height, colWidth) + 2; // +2 = espaço entre linhas
        col1Height += drawField('Marca/Modelo', `${manutencao.marca} ${manutencao.modelo} (${manutencao.ano})`, col1X, currentY + col1Height, colWidth) + 2;

        // Coluna 2
        col2Height += drawField('Tipo', manutencao.tipo_veiculo, col2X, currentY + col2Height, colWidth) + 2;
        col2Height += drawField('KM Atual', String(manutencao.km_atual), col2X, currentY + col2Height, colWidth) + 2;

        // Define Y para após a maior coluna + espaçamento
        doc.y = currentY + Math.max(col1Height, col2Height) + 10; // ✅ MAIS ESPAÇAMENTO
        doc.moveDown(1);

        // --- DETALHES DA MANUTENÇÃO (2 Colunas Refinadas, Novos Campos) ---
        doc.fontSize(11).font('Helvetica-Bold').text('Detalhes da Manutenção', pageMarginLeft, doc.y, { align: 'left', underline: true, width: pageWidth });
        doc.moveDown(1);
        doc.fontSize(9);
        currentY = doc.y;
        col1Height = 0;
        col2Height = 0;

        // Coluna 1
        col1Height += drawField('Tipo', manutencao.tipo, col1X, currentY + col1Height, colWidth) + 2;
        col1Height += drawField('Solicitado por', manutencao.solicitante_nome, col1X, currentY + col1Height, colWidth) + 2;
        col1Height += drawField('Data Solicitação', manutencao.data_solicitacao ? new Date(manutencao.data_solicitacao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : null, col1X, currentY + col1Height, colWidth) + 2;

        // Coluna 2
        col2Height += drawField('Realizado por', manutencao.mecanico_nome, col2X, currentY + col2Height, colWidth) + 2;
        col2Height += drawField('Finalizado em', manutencao.data_finalizacao ? new Date(manutencao.data_finalizacao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : null, col2X, currentY + col2Height, colWidth) + 2;

        // Define Y para após a maior coluna + espaçamento
        doc.y = currentY + Math.max(col1Height, col2Height) + 10; // ✅ MAIS ESPAÇAMENTO
        doc.moveDown(1);

        // --- TABELA DE PEÇAS E SERVIÇOS (REVISADA NOVAMENTE) ---
        doc.fontSize(11).font('Helvetica-Bold').text('Peças/Serviços Realizados:', pageMarginLeft, doc.y, { align: 'center', underline: true, width: pageWidth });
        doc.moveDown(1,5);

        const tableTopY = doc.y;
        const itemColX = pageMarginLeft; // Começa na margem
        const qtdColX = itemColX + 350; // Descrição mais larga
        const marcaColX = qtdColX + 60; // Qtd mais estreita
        const tableWidth = pageWidth; // Usa largura total

        // Cabeçalho da Tabela
        doc.font('Helvetica-Bold').fontSize(8);
        doc.text('Item / Descrição', itemColX + 5, tableTopY); // Adiciona padding
        doc.text('Qtd.', qtdColX, tableTopY, {width: marcaColX - qtdColX - 5, align: 'center'});
        doc.text('Marca', marcaColX, tableTopY);
        doc.y = tableTopY + 12; // Pula linha do cabeçalho
        doc.moveTo(pageMarginLeft, doc.y).lineTo(pageMarginLeft + tableWidth, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(0.8);

        // Linhas da Tabela (LÓGICA CORRIGIDA PARA EXIBIÇÃO)
        doc.font('Helvetica').fontSize(8);
        if (Array.isArray(manutencao.pecas) && manutencao.pecas.length > 0) {
            manutencao.pecas.forEach(p => {
                const startY = doc.y;
                const tipo = p.tipo === 'Servico' ? '[S]' : '[P]';
                const qtd = p.tipo === 'Servico' ? '-' : (p.quantidade || 1);
                const marca = p.marca || '-';
                const descricao = p.descricao || 'N/A';

                // Calcula altura da linha ANTES de desenhar
                const descHeight = doc.heightOfString(`${tipo} ${descricao}`, { width: qtdColX - itemColX - 10 });
                const qtdHeight = doc.heightOfString(String(qtd), { width: marcaColX - qtdColX - 10 });
                const marcaHeight = doc.heightOfString(marca, { width: pageMarginLeft + tableWidth - marcaColX - 5});
                const lineHeight = Math.max(descHeight, qtdHeight, marcaHeight) + 4; // Pega a maior altura + padding

                 // Verifica se cabe na página ANTES de desenhar a linha
                 if (startY + lineHeight > doc.page.height - doc.page.margins.bottom - 60) { // Reserva espaço para assinaturas
                     doc.addPage();
                     // Redesenha cabeçalho da tabela na nova página (opcional, mas bom)
                     const newTableTopY = doc.page.margins.top;
                     doc.font('Helvetica-Bold').fontSize(8);
                     doc.text('Item / Descrição', itemColX + 5, newTableTopY);
                     doc.text('Qtd.', qtdColX, newTableTopY, {width: marcaColX - qtdColX - 5, align: 'center'});
                     doc.text('Marca', marcaColX, newTableTopY);
                     doc.y = newTableTopY + 12; 
                     doc.moveTo(pageMarginLeft, doc.y).lineTo(pageMarginLeft + tableWidth, doc.y).strokeColor('#cccccc').stroke();
                     doc.moveDown(0.8);
                     doc.font('Helvetica').fontSize(8);
                     startY = doc.y; // Atualiza startY para a nova página
                 }

                // Desenha os textos
                doc.text(`${tipo} ${descricao}`, itemColX + 5, startY, { width: qtdColX - itemColX - 10, align: 'left' });
                doc.text(String(qtd), qtdColX, startY, { width: marcaColX - qtdColX - 10, align: 'center' });
                doc.text(marca, marcaColX, startY, { width: pageMarginLeft + tableWidth - marcaColX - 5, align: 'left' });

                // Move para a próxima linha
                doc.y = startY + lineHeight; 
            });
        } else {
            doc.text('Nenhum item detalhado.', itemColX + 5, doc.y);
            doc.moveDown();
        }

        // Garante MUITO espaço antes das assinaturas
        // Se a posição atual for muito baixa, força nova página
        if (doc.y > doc.page.height - doc.page.margins.bottom - 70) { 
             doc.addPage(); 
             doc.y = doc.page.margins.top;
        } else {
             // Move o cursor para uma posição fixa perto do rodapé para as assinaturas
             doc.y = doc.page.height - doc.page.margins.bottom - 60;
        }


        // --- ASSINATURAS (RE-ADICIONADAS E POSICIONADAS) ---
        const signatureY = doc.y; // Usa a posição Y calculada
        const signatureWidth = 200;

        doc.moveTo(pageMarginLeft, signatureY).lineTo(pageMarginLeft + signatureWidth, signatureY).strokeColor('#000000').stroke();
        doc.font('Helvetica').fontSize(8).text('Mecânico Responsável', pageMarginLeft, signatureY + 5, { width: signatureWidth, align: 'center' });

        const engineerX = pageMarginLeft + tableWidth - signatureWidth;
        doc.moveTo(engineerX, signatureY).lineTo(engineerX + signatureWidth, signatureY).strokeColor('#000000').stroke();
        doc.fontSize(8).text('Engenheiro Responsável', engineerX, signatureY + 5, { width: signatureWidth, align: 'center' });

        // --- FIM DO CONTEÚDO ---
        doc.end();

    } catch (error) { console.error(`Erro PDF OS ${manutencaoId}:`, error); /* ... (tratamento erro) ... */ }
    finally { if (client) client.release(); }
};


/**
 * GERA PDF DO RELATÓRIO MENSAL - v3 (Cabeçalho Padrão)
 */
export const gerarPdfRelatorioMensalVeiculo = async (req, res) => {
    const { veiculoId } = req.params;
    const { mes, ano } = req.query; 

    if (!mes || !ano || isNaN(parseInt(mes)) || isNaN(parseInt(ano)) || mes < 1 || mes > 12) {
        return res.status(400).json({ error: 'Parâmetros "mes" (1-12) e "ano" (numérico) são obrigatórios.' });
    }

    const allowedRoles = ['SUPER_ADMIN', 'ESCRITORIO'];
    if (!allowedRoles.includes(req.usuario.role)) {
        return res.status(403).json({ message: 'Acesso não autorizado.' });
    }

    const client = await pool.connect();
    try {
        // 1. Buscar dados do veículo
        const veiculoResult = await client.query('SELECT placa, marca, modelo, ano, tipo FROM veiculos WHERE id = $1', [veiculoId]);
        if (veiculoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }
        const veiculo = veiculoResult.rows[0];

        // 2. Buscar manutenções do veículo no mês/ano especificado
        const startDate = new Date(ano, mes - 1, 1); 
        const endDate = new Date(ano, mes, 0); 
        const manutencoesQuery = `
            SELECT id, numero_os, data, tipo, km_atual, pecas 
            FROM manutencoes 
            WHERE veiculo_id = $1 AND data >= $2 AND data <= $3 
            ORDER BY data ASC, numero_os ASC;
        `;
        const manutencoesResult = await client.query(manutencoesQuery, [veiculoId, startDate, endDate]);
        const manutencoesDoMes = manutencoesResult.rows;

        // --- GERAÇÃO DO PDF ---
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
            bufferPages: true
        });

        // --- Novo Bloco de Nomenclatura do Relatório ---
            const mesFormatado = String(mes).padStart(2, '0');
            const periodo = `${mesFormatado}.${ano}`; // 10.2025
            const placaLimpa = veiculo.placa.replace(/[\s\/]+/g, '');

            // Nova Nomenclatura: Relatorio-Mensal-10.2025-ABE2G22.pdf
            const filename = `Relatorio-Mensal-${periodo}-${placaLimpa}.pdf`;
            console.log("Gerando Relatório com nome de arquivo:", filename); // <-- ADICIONE ESTE LOG
            // --- Fim do Novo Bloco ---
        res.setHeader('Content-disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        // --- DEFINIR CAMINHOS ---
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        // --- CONSTANTES DE LAYOUT (Como na OS) ---
        const pageMarginLeft = doc.page.margins.left;
        const pageMarginRight = doc.page.margins.right;
        const pageWidth = doc.page.width - pageMarginLeft - pageMarginRight;
        const col1X = pageMarginLeft;
        const colWidth = (pageWidth / 2) - 10;
        const col2X = pageMarginLeft + colWidth + 20;

        // --- CABEÇALHO (Igual ao da OS) ---
        const headerStartY = doc.page.margins.top;

        // --- LOGO ---
        const logoPath = path.join(__dirname, '..', 'assets', 'logo_FOCO_PNG.png'); // CONFIRME O NOME!
        const logoWidth = 120;
        let logoHeight = 40; 
        try {
            if (fs.existsSync(logoPath)) {
                 const img = doc.openImage(logoPath);
                 logoHeight = (img.height * logoWidth) / img.width;
                 doc.image(logoPath, pageMarginLeft, headerStartY - 10, { width: logoWidth });
            } else { console.warn(`Logo não encontrada: ${logoPath}`); }
        } catch (imgErr) { console.error("Erro logo:", imgErr); }
        // --- FIM LOGO ---
        
        // Nome da Empresa
        const companyNameY = headerStartY + 45;
        doc.fontSize(12).font('Helvetica-Bold')
           .text('Foco Soluções Ambientais e Serviços LTDA', col2X - 10, companyNameY, {
               width: colWidth + 10,
               align: 'right'
           });

        // Título "RELATÓRIO MENSAL"
        const titleY = headerStartY + logoHeight + 15;
        doc.fontSize(18).font('Helvetica-Bold')
           .text('Relatório Mensal de Manutenções', pageMarginLeft, titleY, { align: 'center'}); 
        doc.y = titleY + 65;
        // --- FIM DO CABEÇALHO ---

        // Período e Dados do Veículo
        const infoY = doc.y; 
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Período: ${String(mes).padStart(2, '0')}/${ano}`, { align: 'left' });
        doc.text(`Veículo: ${veiculo.marca} ${veiculo.modelo} (${veiculo.ano}) - Placa: ${veiculo.placa}`, { align: 'left' });
        doc.moveDown(1.5);
        doc.moveTo(pageMarginLeft, doc.y).lineTo(pageMarginLeft + pageWidth, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(1);


        // --- TABELA DE MANUTENÇÕES ---
        doc.fontSize(11).font('Helvetica-Bold').text('Manutenções Realizadas no Período:', { underline: true });
        doc.moveDown(1.2);

        const tableTopY = doc.y;
        // Definição das colunas
        const colData = pageMarginLeft;
        const colOS = colData + 65;
        const colTipo = colOS + 70;
        const colKM = colTipo + 60;
        const colDesc = colKM + 60;
        const colDescWidth = pageWidth - colDesc + pageMarginLeft - 5; 

        // Função para desenhar o cabeçalho da tabela
        const drawTableHeader = (y) => {
            doc.font('Helvetica-Bold').fontSize(8);
            doc.text('Data', colData, y);
            doc.text('Nº OS', colOS, y);
            doc.text('Tipo', colTipo, y);
            doc.text('KM', colKM, y);
            doc.text('Descrição Principal', colDesc, y);
            doc.y = y + 12; 
            doc.moveTo(pageMarginLeft, doc.y).lineTo(pageMarginLeft + pageWidth, doc.y).strokeColor('#cccccc').stroke();
            doc.moveDown(0.8);
        };

        // Desenha o primeiro cabeçalho
        drawTableHeader(tableTopY);

        doc.font('Helvetica').fontSize(8);

        if (manutencoesDoMes.length > 0) {
             manutencoesDoMes.forEach(m => {
                 const startY = doc.y;
                 let descricao = 'N/A';
                 if (Array.isArray(m.pecas) && m.pecas.length > 0 && m.pecas[0].descricao) {
                     descricao = m.pecas[0].descricao;
                 }
                 
                 const descHeight = doc.heightOfString(descricao, { width: colDescWidth });
                 const lineHeight = descHeight + 6; 

                 if (startY + lineHeight > doc.page.height - doc.page.margins.bottom - 60) { 
                     doc.addPage();
                     drawTableHeader(doc.page.margins.top); 
                     startY = doc.y; 
                 }

                 const dataFmt = new Date(m.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                 const osNum = m.numero_os ? `OS-${String(m.numero_os).padStart(6, '0')}` : '-';
                 
                 doc.text(dataFmt, colData, startY, { width: colOS - colData - 5 });
                 doc.text(osNum, colOS, startY, { width: colTipo - colOS - 5 });
                 doc.text(m.tipo, colTipo, startY, { width: colKM - colTipo - 5 });
                 doc.text(m.km_atual, colKM, startY, { width: colDesc - colKM - 5 });
                 doc.text(descricao, colDesc, startY, { width: colDescWidth }); 

                 doc.y = startY + lineHeight; 
             });
         } else {
            doc.font('Helvetica').fontSize(9).text('Nenhuma manutenção registrada neste período.');
            doc.moveDown();
         }

        // Garante espaço antes das assinaturas
        if (doc.y > doc.page.height - doc.page.margins.bottom - 70) { 
             doc.addPage(); 
             doc.y = doc.page.margins.top;
        } else {
             doc.y = doc.page.height - doc.page.margins.bottom - 60;
        }

        // --- ASSINATURAS ---
        const signatureY = doc.y;
        const signatureWidth = 200;

        doc.moveTo(pageMarginLeft, signatureY).lineTo(pageMarginLeft + signatureWidth, signatureY).strokeColor('#000000').stroke();
        doc.font('Helvetica').fontSize(8).text('Engenheiro Responsável', pageMarginLeft, signatureY + 5, { width: signatureWidth, align: 'center' });

        const signature2X = pageMarginLeft + pageWidth - signatureWidth;
        doc.moveTo(signature2X, signatureY).lineTo(signature2X + signatureWidth, signatureY).strokeColor('#000000').stroke();
        doc.fontSize(8).text('Responsável Frota / Cliente', signature2X, doc.y + 5, { width: signatureWidth, align: 'center' });


        // --- FIM DO CONTEÚDO ---
        doc.end();

    } catch (error) {
        console.error(`Erro ao gerar Relatório Mensal para Veículo ID ${veiculoId}:`, error);
        if (!res.headersSent) { res.status(500).json({ error: 'Erro interno ao gerar relatório.' }); }
        else { res.end(); }
    } finally {
        if (client) client.release();
    }
};
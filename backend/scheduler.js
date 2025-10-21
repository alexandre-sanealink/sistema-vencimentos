import cron from 'node-cron';
import pg from 'pg';
const { Pool } = pg;
import { enviarEmail } from './mailer.js';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGHOST && process.env.PGHOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

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

const verificarManutencoesPorTempo = async () => {
    const dataFormatada = new Date().toLocaleString('pt-BR', { timeZone: "America/Sao_Paulo" });
    console.log(`[${dataFormatada}] Executando verificação de manutenções preventivas...`);
    
    const client = await pool.connect();
    try {
        // 1. Busca todos os itens de plano que possuem um intervalo (KM ou Dias), junto com os dados do veículo.
        const planosResult = await client.query(`
            SELECT 
                pm.id, pm.veiculo_id, pm.descricao, pm.intervalo_dias, pm.intervalo_km, pm.created_at,
                v.placa, v.modelo
            FROM planos_manutencao pm
            JOIN veiculos v ON pm.veiculo_id = v.id
            WHERE pm.intervalo_dias IS NOT NULL OR pm.intervalo_km IS NOT NULL;
        `);
        const planos = planosResult.rows;

        if (planos.length === 0) {
            console.log('Nenhum plano de manutenção encontrado para verificar.');
            client.release();
            return;
        }

        const usuariosResult = await client.query(
            "SELECT id, email FROM usuarios WHERE role IN ('SUPER_ADMIN', 'ESCRITORIO', 'ENCARREGADO', 'MECANICO')"
        );
        const usuariosParaNotificar = usuariosResult.rows;
        
        if (usuariosParaNotificar.length === 0) {
            console.log('Nenhum usuário encontrado para notificar sobre manutenções.');
            client.release();
            return;
        }

        for (const plano of planos) {
            // =================================================================
            // --- INÍCIO DA LÓGICA DE CÁLCULO UNIFICADA (KM + TEMPO) ---
            // =================================================================

            // 3. Busca o KM atual do veículo (ESSENCIAL PARA A LÓGICA COMPLETA)
            const kmAtualResult = await client.query(
                `SELECT GREATEST(
                    (SELECT km_atual FROM manutencoes WHERE veiculo_id = $1 ORDER BY data DESC, id DESC LIMIT 1),
                    (SELECT km_atual FROM abastecimentos WHERE veiculo_id = $1 ORDER BY data DESC, id DESC LIMIT 1)
                ) as km_atual`,
                [plano.veiculo_id]
            );
            const kmAtual = kmAtualResult.rows.length > 0 && kmAtualResult.rows[0].km_atual ? parseInt(kmAtualResult.rows[0].km_atual) : 0;
            
            // 4. Busca a última manutenção preventiva correspondente
            const ultimaManutencaoResult = await client.query(
                `SELECT data, km_atual FROM manutencoes 
                 WHERE veiculo_id = $1 AND tipo = 'Preventiva' AND pecas::text ILIKE $2 
                 ORDER BY data DESC, id DESC LIMIT 1`,
                [plano.veiculo_id, `%${plano.descricao}%`]
            );
            const ultimaManutencao = ultimaManutencaoResult.rows.length > 0 ? ultimaManutencaoResult.rows[0] : null;

            // 5. Calcula o status de KM
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

            // 6. Calcula o status de Tempo
            let statusTempo = 'Em Dia';
            if (plano.intervalo_dias) {
                const dataBase = ultimaManutencao ? new Date(ultimaManutencao.data) : new Date(plano.created_at);
                const proximaData = new Date(dataBase);
                proximaData.setDate(proximaData.getDate() + parseInt(plano.intervalo_dias));
                const diasFaltantes = Math.ceil((proximaData.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                if (diasFaltantes <= 0) {
                    statusTempo = 'Vencido';
                } else if (diasFaltantes <= (parseInt(plano.intervalo_dias) * 0.15)) {
                    statusTempo = 'Alerta';
                }
            }
            
            // 7. Consolida o status final
            let statusFinal = 'Em Dia';
            if (statusKm === 'Alerta' || statusTempo === 'Alerta') {
                statusFinal = 'Alerta';
            }
            if (statusKm === 'Vencido' || statusTempo === 'Vencido') {
                statusFinal = 'Vencido';
            }

            // =================================================================
            // --- FIM DA LÓGICA DE CÁLCULO ---
            // =================================================================

            if (statusFinal === 'Alerta' || statusFinal === 'Vencido') {
                const veiculoNome = `${plano.modelo} (${plano.placa})`;
                const statusTexto = statusFinal === 'Vencido' ? `está vencida` : `entrou em alerta de manutenção`;

                const mensagem = `Manutenção Preventiva: A tarefa "${plano.descricao}" para o veículo ${veiculoNome} ${statusTexto}.`;
                const link = `/veiculo/${plano.veiculo_id}`;
                const assuntoEmail = `Alerta de Manutenção: ${plano.descricao} - ${veiculoNome}`;
                
                console.log(`GERANDO ALERTA: ${mensagem}`);

                for (const user of usuariosParaNotificar) {
                    await criarNotificacaoEEnviarEmail(client, {
                        usuarioId: user.id, mensagem, link,
                        email: user.email, assuntoEmail, corpoEmail: `Olá,\n\n${mensagem}\n\nPor favor, acesse o sistema para mais detalhes.`
                    });
                }
            }
        }
        console.log('Verificação de manutenções concluída.');

    } catch (error) {
        console.error('Erro durante a verificação agendada de manutenções:', error);
    } finally {
        client.release();
    }
};

const iniciarScheduler = () => {
    cron.schedule('0 2 * * *', verificarManutencoesPorTempo, {
        timezone: "America/Sao_Paulo"
    });
    console.log('✅ Agendador de tarefas (Scheduler) iniciado. Verificações ocorrerão diariamente às 02:00.');
    
    // Deixe esta linha descomentada para o teste
    // verificarManutencoesPorTempo(); 
};

export { iniciarScheduler };
import cron from 'node-cron';
import pg from 'pg';
const { Pool } = pg;
import { enviarEmail } from './mailer.js'; // Importamos nossa ferramenta de e-mail

const pool = new Pool(
    process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } 
      } 
    : {} 
);

// Função auxiliar (redefinida aqui para independência)
const criarNotificacaoEEnviarEmail = async (client, { usuarioId, mensagem, link, email, assuntoEmail, corpoEmail }) => {
    // ... (código da função criarNotificacaoEEnviarEmail como na versão anterior) ...
     try {
        if (usuarioId && mensagem && link) { // Só cria notificação interna se tiver todos os dados
            const queryNotificacao = `
                INSERT INTO notificacoes (usuario_id, mensagem, link) VALUES ($1, $2, $3);
            `;
            await client.query(queryNotificacao, [usuarioId, mensagem, link]);
        }

        if (email) {
            enviarEmail(email, assuntoEmail, corpoEmail)
                .catch(err => console.error(`Falha ao enviar e-mail de notificação para ${email}:`, err));
        }
    } catch (error) {
        console.error(`Erro ao processar notificação/email para usuário ${usuarioId || email}:`, error);
    }
};


// Função para verificar manutenções (como na versão anterior)
const verificarManutencoesPorTempo = async () => {
    // ... (código COMPLETO da função verificarManutencoesPorTempo como na versão anterior) ...
    const dataFormatada = new Date().toLocaleString('pt-BR', { timeZone: "America/Sao_Paulo" });
    console.log(`[${dataFormatada}] Executando verificação de manutenções preventivas...`);
    
    const client = await pool.connect();
    try {
        const planosResult = await client.query(`
            SELECT pm.id, pm.veiculo_id, pm.descricao, pm.intervalo_dias, pm.intervalo_km, pm.created_at, v.placa, v.modelo
            FROM planos_manutencao pm JOIN veiculos v ON pm.veiculo_id = v.id
            WHERE pm.intervalo_dias IS NOT NULL OR pm.intervalo_km IS NOT NULL;
        `);
        const planos = planosResult.rows;
        if (planos.length === 0) { console.log('[Manutenções] Nenhum plano encontrado.'); client.release(); return; }

        const usuariosResult = await client.query("SELECT id, email FROM usuarios WHERE role IN ('SUPER_ADMIN', 'ESCRITORIO', 'ENCARREGADO', 'MECANICO')");
        const usuariosParaNotificar = usuariosResult.rows;
        if (usuariosParaNotificar.length === 0) { console.log('[Manutenções] Nenhum usuário encontrado para notificar.'); client.release(); return; }

        for (const plano of planos) {
             const kmAtualResult = await client.query(`SELECT GREATEST((SELECT km_atual FROM manutencoes WHERE veiculo_id = $1 ORDER BY data DESC, id DESC LIMIT 1), (SELECT km_atual FROM abastecimentos WHERE veiculo_id = $1 ORDER BY data DESC, id DESC LIMIT 1)) as km_atual`, [plano.veiculo_id]);
             const kmAtual = kmAtualResult.rows.length > 0 && kmAtualResult.rows[0].km_atual ? parseInt(kmAtualResult.rows[0].km_atual) : 0;
            
             const ultimaManutencaoResult = await client.query(`SELECT data, km_atual FROM manutencoes WHERE veiculo_id = $1 AND tipo = 'Preventiva' AND pecas::text ILIKE $2 ORDER BY data DESC, id DESC LIMIT 1`, [plano.veiculo_id, `%${plano.descricao}%`]);
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
            
             let statusFinal = 'Em Dia';
             if (statusKm === 'Alerta' || statusTempo === 'Alerta') statusFinal = 'Alerta';
             if (statusKm === 'Vencido' || statusTempo === 'Vencido') statusFinal = 'Vencido';

             if (statusFinal === 'Alerta' || statusFinal === 'Vencido') {
                 const veiculoNome = `${plano.modelo} (${plano.placa})`;
                 const statusTexto = statusFinal === 'Vencido' ? `está vencida` : `entrou em alerta de manutenção`;
                 const mensagem = `Manutenção Preventiva: A tarefa "${plano.descricao}" para o veículo ${veiculoNome} ${statusTexto}.`;
                 const link = `/veiculo/${plano.veiculo_id}`;
                 const assuntoEmail = `Alerta de Manutenção: ${plano.descricao} - ${veiculoNome}`;
                 console.log(`[Manutenções] GERANDO ALERTA: ${mensagem}`);
                 for (const user of usuariosParaNotificar) {
                     await criarNotificacaoEEnviarEmail(client, { usuarioId: user.id, mensagem, link, email: user.email, assuntoEmail, corpoEmail: `Olá,\n\n${mensagem}\n\nPor favor, acesse o sistema para mais detalhes.` });
                 }
             }
        }
        console.log('[Manutenções] Verificação concluída.');
    } catch (error) {
        console.error('[Manutenções] Erro durante verificação agendada:', error);
    } finally {
        if (client) client.release();
    }
};

// =================================================================
// --- NOVA FUNÇÃO PARA VERIFICAR VENCIMENTO DE DOCUMENTOS ---
// =================================================================
const verificarVencimentosDocumentos = async () => {
    const dataFormatada = new Date().toLocaleString('pt-BR', { timeZone: "America/Sao_Paulo" });
    console.log(`[${dataFormatada}] Executando verificação de vencimentos de documentos...`);

    const client = await pool.connect();
    try {
        // 1. Busca documentos que estão vencidos ou entram no período de alerta HOJE.
        //    (dataVencimento <= hoje + diasAlerta) AND (dataVencimento >= hoje) -> Alerta
        //    (dataVencimento < hoje) -> Vencido
        const queryDocumentos = `
            SELECT id, nome, "dataVencimento", "diasAlerta" 
            FROM documentos
            WHERE "dataVencimento" IS NOT NULL AND "diasAlerta" IS NOT NULL 
              AND "dataVencimento" <= (CURRENT_DATE + interval '1 day' * "diasAlerta");
        `;
        const documentosResult = await client.query(queryDocumentos);
        const documentosParaAlertar = documentosResult.rows;

        if (documentosParaAlertar.length === 0) {
            console.log('[Documentos] Nenhum documento vencido ou em alerta encontrado.');
            return;
        }

        // 2. Busca os usuários que devem receber os alertas (SUPER_ADMIN e ESCRITORIO)
        const queryUsuarios = `SELECT id, email FROM usuarios WHERE role IN ('SUPER_ADMIN', 'ESCRITORIO')`;
        const usuariosResult = await client.query(queryUsuarios);
        const usuariosParaNotificar = usuariosResult.rows;

        if (usuariosParaNotificar.length === 0) {
            console.log('[Documentos] Nenhum usuário (SUPER_ADMIN/ESCRITORIO) encontrado para notificar.');
            return;
        }

        // 3. Itera sobre cada documento e envia o e-mail/notificação
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

        for (const doc of documentosParaAlertar) {
            const dataVenc = new Date(doc.dataVencimento);
            const diffTime = dataVenc.getTime() - hoje.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let statusTexto = '';
            let assuntoEmail = '';
            if (diffDays < 0) {
                statusTexto = `está VENCIDO há ${Math.abs(diffDays)} dia(s)`;
                assuntoEmail = `Documento Vencido: ${doc.nome}`;
            } else if (diffDays <= doc.diasAlerta) {
                statusTexto = `VENCE em ${diffDays} dia(s)`;
                assuntoEmail = `Alerta de Vencimento: ${doc.nome}`;
            } else {
                continue; // Documento ainda não está no período de alerta hoje, pula.
            }

            const mensagem = `Alerta de Documento: O documento "${doc.nome}" ${statusTexto}. Data de Vencimento: ${dataVenc.toLocaleDateString('pt-BR')}.`;
            const link = `/documentos`; // Link genérico para a página de documentos
            
            console.log(`[Documentos] GERANDO ALERTA: ${mensagem}`);

            // Envia para todos os admins/escritório
            for (const user of usuariosParaNotificar) {
                 await criarNotificacaoEEnviarEmail(client, { 
                     // Para documentos, talvez só e-mail seja suficiente? 
                     // Se quiser notificação interna, precisa do usuarioId: user.id
                     // usuarioId: user.id, 
                     // mensagem: mensagem,
                     // link: link,
                     email: user.email, 
                     assuntoEmail: assuntoEmail, 
                     corpoEmail: `Olá,\n\n${mensagem}\n\nPor favor, acesse o sistema para mais detalhes.`
                 });
            }
        }
        console.log('[Documentos] Verificação concluída.');

    } catch (error) {
        console.error('[Documentos] Erro durante verificação agendada:', error);
    } finally {
        if (client) client.release();
    }
};


/**
 * Agenda TODAS as tarefas para serem executadas.
 */
const iniciarScheduler = () => {
    const timezone = "America/Sao_Paulo";

    // Agenda a verificação de MANUTENÇÕES para 2:00 AM
    cron.schedule('0 2 * * *', verificarManutencoesPorTempo, { timezone });
    console.log('✅ Agendada verificação de Manutenções Preventivas (Diariamente às 02:00).');

    // Agenda a verificação de DOCUMENTOS para 2:05 AM (5 minutos depois)
    cron.schedule('5 2 * * *', verificarVencimentosDocumentos, { timezone });
    console.log('✅ Agendada verificação de Vencimentos de Documentos (Diariamente às 02:05).');

    // Descomente as linhas abaixo para forçar a execução na inicialização (para testes)
    // console.log('--- EXECUTANDO TAREFAS AGENDADAS IMEDIATAMENTE PARA TESTE ---');
    // verificarManutencoesPorTempo(); 
    // verificarVencimentosDocumentos(); 
};

export { iniciarScheduler };
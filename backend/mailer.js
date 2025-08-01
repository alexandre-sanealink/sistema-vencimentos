import nodemailer from 'nodemailer';
import cron from 'node-cron';
import fs from 'fs/promises';
import 'dotenv/config'; // Carrega as variáveis do arquivo .env

const DB_PATH = './database.json';

// Configuração do "mensageiro" (Nodemailer)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true para a porta 465
    auth: {
        user: process.env.EMAIL_USER, // Pega o usuário do arquivo .env
        pass: process.env.EMAIL_PASS, // Pega a senha do arquivo .env
    },
});

// Função principal que verifica os vencimentos
const checarVencimentos = async () => {
    console.log('🔎 Executando verificação de vencimentos...');
    try {
        const dados = await fs.readFile(DB_PATH, 'utf-8');
        const documentos = JSON.parse(dados);

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas as datas

        for (const doc of documentos) {
            // Ignora documentos que não precisam de alerta
            if (doc.status === 'Renovado' || doc.status === 'Atrasado') {
                continue;
            }

            const dataVencimento = new Date(doc.dataVencimento);
            
            // Calcula a diferença em dias
            const diffTime = dataVencimento.getTime() - hoje.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Verifica se está na hora de alertar
            if (diffDays <= doc.diasAlerta && diffDays >= 0) {
                console.log(`❗ Alerta para o documento: ${doc.nome}`);

                const mailOptions = {
                    from: `"Sistema de Alertas" <${process.env.EMAIL_USER}>`,
                    to: process.env.EMAIL_TO,
                    subject: `Alerta de Vencimento: ${doc.nome}`,
                    html: `
                        <h2>Olá!</h2>
                        <p>Este é um lembrete de que o seu documento <strong>${doc.nome}</strong> está próximo do vencimento.</p>
                        <p><strong>Data de Vencimento:</strong> ${dataVencimento.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                        <p>Faltam <strong>${diffDays} dia(s)</strong> para o vencimento.</p>
                        <p>Status atual: <strong>${doc.status}</strong></p>
                        <br>
                        <p><em>Por favor, não responda este e-mail.</em></p>
                    `,
                };

                // Envia o e-mail
                await transporter.sendMail(mailOptions);
                console.log(`✅ E-mail de alerta para "${doc.nome}" enviado com sucesso!`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao checar vencimentos ou enviar e-mails:', error);
    }
};

// Agenda a tarefa para rodar todos os dias às 8h da manhã
cron.schedule('0 8 * * *', checarVencimentos, {
    timezone: "America/Sao_Paulo"
});

console.log('⏰ Agendador de e-mails iniciado. A verificação ocorrerá todos os dias às 08:00.');

// Para um teste imediato (apague ou comente esta linha depois de testar)
// checarVencimentos();
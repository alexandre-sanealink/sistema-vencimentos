import nodemailer from 'nodemailer';
import 'dotenv/config';

// 1. Configura o "transportador" do Nodemailer para usar o SendGrid.
// Ele automaticamente busca a variável de ambiente SENDGRID_API_KEY.
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false, // true para 465, false para outras portas
    auth: {
        user: 'apikey', // O usuário é literalmente a string 'apikey'
        pass: process.env.SENDGRID_API_KEY, // A senha é a sua chave de API
    },
});

/**
 * Função para enviar um e-mail.
 * @param {string} para - O e-mail do destinatário.
 * @param {string} assunto - O assunto do e-mail.
 * @param {string} texto - O corpo do e-mail em texto simples.
 */
export const enviarEmail = async (para, assunto, texto) => {
    try {
        const info = await transporter.sendMail({
            from: '"Sistema Foco" <alexandre@solucoesfoco.com.br>', // IMPORTANTE: Veja a nota abaixo
            to: para,
            subject: assunto,
            text: texto,
        });

        console.log(`E-mail enviado com sucesso para ${para}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Falha ao enviar e-mail para ${para}:`, error);
        // Em um ambiente de produção, seria bom logar este erro em um serviço de monitoramento.
        throw error;
    }
};
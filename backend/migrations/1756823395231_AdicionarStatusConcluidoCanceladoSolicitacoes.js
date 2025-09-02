/* eslint-disable camelcase */

export const shorthands = undefined;

export function up(pgm) {
    pgm.sql(`
        -- Adiciona uma regra (constraint) à tabela de solicitações.
        -- Esta regra garante que a coluna 'status' só pode aceitar um dos quatro valores listados.
        -- Isso aumenta a segurança e a integridade dos seus dados.
        ALTER TABLE solicitacoes_manutencao
        ADD CONSTRAINT status_validos CHECK (status IN ('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'));
    `);
}

export function down(pgm) {
    pgm.sql(`
        -- Remove a regra adicionada acima, caso precisemos reverter (fazer o 'down') da migração.
        ALTER TABLE solicitacoes_manutencao
        DROP CONSTRAINT status_validos;
    `);
}
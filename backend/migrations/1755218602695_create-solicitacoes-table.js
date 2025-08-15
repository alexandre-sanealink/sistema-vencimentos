/* eslint-disable camelcase */

export const shorthands = undefined;

export function up(pgm) {
    pgm.sql(`
        CREATE TABLE solicitacoes_manutencao (
            id SERIAL PRIMARY KEY,
            veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
            solicitado_por_id INTEGER NOT NULL REFERENCES usuarios(id),
            data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            descricao_problema TEXT NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'ABERTO',
            mecanico_responsavel_id INTEGER REFERENCES usuarios(id),
            data_conclusao TIMESTAMP WITH TIME ZONE,
            manutencao_id INTEGER REFERENCES manutencoes(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);
};

export function down(pgm) {
    pgm.sql(`
        DROP TABLE solicitacoes_manutencao;
    `);
};
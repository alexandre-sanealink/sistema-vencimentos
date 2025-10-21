/* eslint-disable camelcase */

exports.shorthands = undefined;

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = pgm => {
    pgm.addColumn('manutencoes', {
        // Nome da nova coluna
        plano_manutencao_id: {
            type: 'integer', // O tipo de dado deve ser o mesmo que o ID da tabela 'planos_manutencao'
            references: 'planos_manutencao', // Cria a chave estrangeira referenciando a tabela de planos
            onDelete: 'SET NULL', // Se um item do plano for deletado, a referência na manutenção fica nula
            onUpdate: 'CASCADE' // Se o ID do item do plano mudar (raro), atualiza aqui também
        }
    });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = pgm => {
    pgm.dropColumn('manutencoes', 'plano_manutencao_id');
};
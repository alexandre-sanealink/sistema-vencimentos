/* eslint-disable camelcase */

exports.shorthands = undefined;

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = pgm => {
    pgm.addColumn('documentos', {
        // Nome da nova coluna
        veiculo_id: {
            type: 'integer', // Mesmo tipo do ID da tabela 'veiculos'
            references: 'veiculos', // Cria a chave estrangeira referenciando a tabela de veículos
            onDelete: 'SET NULL', // Se um veículo for deletado, o ID no documento fica nulo (ou 'CASCADE' para deletar o doc junto?) - SET NULL parece mais seguro.
            onUpdate: 'CASCADE' // Se o ID do veículo mudar, atualiza aqui também
        }
    });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = pgm => {
    pgm.dropColumn('documentos', 'veiculo_id');
};
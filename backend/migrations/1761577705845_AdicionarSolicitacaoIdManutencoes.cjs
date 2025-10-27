/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumn('manutencoes', {
        solicitacao_id: {
            type: 'integer',
            references: 'solicitacoes_manutencao', // Chave estrangeira
            onDelete: 'SET NULL', // Se a solicitação for deletada, o ID aqui fica nulo
            onUpdate: 'CASCADE'
        }
    });
};

exports.down = pgm => {
    pgm.dropColumn('manutencoes', 'solicitacao_id');
};
/* eslint-disable camelcase */

export const shorthands = undefined;

export function up(pgm) {
  pgm.createTable('notificacoes', {
    id: 'id', // Cria uma coluna 'id' SERIAL PRIMARY KEY automaticamente
    usuario_id: {
      type: 'integer',
      notNull: true,
      references: '"usuarios"', // Faz referência à tabela de usuários
      onDelete: 'CASCADE', // Se um usuário for deletado, suas notificações também serão
    },
    mensagem: {
      type: 'text',
      notNull: true,
    },
    link: {
      type: 'varchar(255)', // Um link opcional para a notificação
    },
    lida: {
      type: 'boolean',
      notNull: true,
      default: false, // Por padrão, uma notificação começa como "não lida"
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
}

export function down(pgm) {
  pgm.dropTable('notificacoes');
}
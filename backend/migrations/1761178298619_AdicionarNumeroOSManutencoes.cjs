/* eslint-disable camelcase */

exports.shorthands = undefined;

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = pgm => {
    // 1. Cria a sequência que gerará os números
    pgm.createSequence('os_numero_seq', {
        increment: 1, // Incrementa de 1 em 1
        start: 1      // Começa do número 1
    });

    // 2. Adiciona a coluna para armazenar o número da OS
    pgm.addColumn('manutencoes', {
        numero_os: {
            type: 'integer',
            // Define o valor padrão como o próximo número da sequência
            default: pgm.func("nextval('os_numero_seq')"), 
            // Garante que cada número de OS seja único
            unique: true 
        }
    });

    // 3. (Importante) Garante que a sequência pertença à coluna.
    // Isso faz com que, se a coluna for deletada, a sequência também seja.
    pgm.sql("ALTER SEQUENCE os_numero_seq OWNED BY manutencoes.numero_os");

    // 4. (Opcional, mas bom para registros existentes) 
    // Atualiza os registros de manutenção existentes para terem um número de OS inicial.
    // Se você tiver MUITOS registros, isso pode demorar um pouco.
    // Se preferir, pode comentar ou remover este bloco 'pgm.sql'.
    pgm.sql(`
        UPDATE manutencoes 
        SET numero_os = nextval('os_numero_seq') 
        WHERE numero_os IS NULL;
    `);
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = pgm => {
    // Remove a coluna (isso automaticamente remove a sequência por causa do OWNED BY)
    pgm.dropColumn('manutencoes', 'numero_os');
    // A sequência é deletada implicitamente, mas podemos garantir deletando explicitamente caso OWNED BY falhe
    pgm.dropSequence('os_numero_seq'); 
};
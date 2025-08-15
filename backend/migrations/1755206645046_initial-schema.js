/* eslint-disable camelcase */

// Esta primeira linha pode ser ignorada, é para configurações avançadas.
export const shorthands = undefined;

// Esta é a função que será executada quando aplicarmos a migração.
export function up(pgm) {
    // CORREÇÃO: Adicionado "IF NOT EXISTS" em todos os CREATE TABLE
    pgm.sql(`
        -- Tabela de Usuários
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            senha_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE
        );

        -- Tabela de Documentos
        CREATE TABLE IF NOT EXISTS documentos (
            id VARCHAR(255) PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            categoria VARCHAR(100),
            "dataVencimento" DATE,
            "diasAlerta" INTEGER,
            status VARCHAR(50),
            criado_por_email VARCHAR(255),
            nome_arquivo VARCHAR(255),
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modificado_em TIMESTAMP WITH TIME ZONE
        );

        -- Tabela de Veículos
        CREATE TABLE IF NOT EXISTS veiculos (
            id SERIAL PRIMARY KEY,
            placa VARCHAR(10) UNIQUE NOT NULL,
            marca VARCHAR(100) NOT NULL,
            modelo VARCHAR(100) NOT NULL,
            ano INTEGER NOT NULL,
            tipo VARCHAR(100) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de Manutenções
        CREATE TABLE IF NOT EXISTS manutencoes (
            id SERIAL PRIMARY KEY,
            veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
            data DATE NOT NULL,
            tipo VARCHAR(100) NOT NULL,
            km_atual INTEGER NOT NULL,
            pecas JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de Abastecimentos
        CREATE TABLE IF NOT EXISTS abastecimentos (
            id SERIAL PRIMARY KEY,
            veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
            data DATE NOT NULL,
            km_atual INTEGER NOT NULL,
            litros_abastecidos NUMERIC(10, 2) NOT NULL,
            valor_total NUMERIC(10, 2),
            posto VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de Planos de Manutenção
        CREATE TABLE IF NOT EXISTS planos_manutencao (
            id SERIAL PRIMARY KEY,
            veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
            descricao VARCHAR(255) NOT NULL,
            intervalo_km INTEGER,
            intervalo_dias INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

// Esta é a função que reverte a migração, caso necessário.
export function down(pgm) {
    // A função down já usa "IF EXISTS", então está correta.
    pgm.sql(`
        DROP TABLE IF EXISTS planos_manutencao;
        DROP TABLE IF EXISTS abastecimentos;
        DROP TABLE IF EXISTS manutencoes;
        DROP TABLE IF EXISTS veiculos;
        DROP TABLE IF EXISTS documentos;
        DROP TABLE IF EXISTS usuarios;
    `);
}
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    matricula VARCHAR(30) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    funcao ENUM('administrador','garcom','cozinha') NOT NULL
);

-- Exemplo de inserção de usuários
INSERT INTO usuarios (nome, matricula, senha, funcao) VALUES
('Administrador', '0001', '1234', 'administrador'),
('João Garçom', '1001', '1111', 'garcom'),
('Maria Cozinha', '2001', '2222', 'cozinha');

-- Para gerar a senha hash, use password_hash('senha', PASSWORD_DEFAULT) no PHP

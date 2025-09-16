CREATE DATABASE IF NOT EXISTS restaurante_db;
USE restaurante_db;


-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    matricula VARCHAR(30) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    funcao ENUM('administrador','garcom','cozinha','caixa','auxiliar de cozinha','churrasqueiro','cozinheiro') NOT NULL
);

-- Exemplo de inserção de usuários
INSERT INTO usuarios (nome, matricula, senha, funcao) VALUES
('Administrador', '0001', '1234', 'administrador'),
('João', '1001', '1234', 'garcom'),
('Maria', '2001', '1234', 'cozinha'),
('vanio', '0002', '1234', 'caixa');

-- Tabela de itens do cardápio
CREATE TABLE IF NOT EXISTS menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    categoria ENUM('nordestino', 'pizza', 'bebida', 'sobremesa') NOT NULL,
    horario ENUM('dia', 'noite', 'ambos') DEFAULT 'ambos',
    imagem VARCHAR(255)
);

-- Inserção de exemplos com imagens
INSERT INTO menu (nome, descricao, preco, categoria, horario, imagem) VALUES
('Baião de Dois', 'Arroz, feijão-de-corda, carne seca e queijo coalho', 25.00, 'nordestino', 'dia', 'baiao-de-dois.png'),
('Carne de Sol com Macaxeira', 'Carne de sol, macaxeira frita e manteiga de garrafa', 30.00, 'nordestino', 'dia', 'carne_sol.jpg'),
('Pizza Margherita', 'Molho de tomate, muçarela e manjericão', 35.00, 'pizza', 'noite', 'pizza_margherita.jpg'),
('Pizza Calabresa', 'Calabresa, cebola e orégano', 38.00, 'pizza', 'noite', 'pizza_calabresa.jpg'),
('Coca-Cola', 'Refrigerante 350ml', 5.00, 'bebida', 'ambos', 'coca_cola.jpg'),
('Suco de Caju', 'Suco natural de caju', 7.00, 'bebida', 'ambos', 'suco_caju.jpg');

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mesa INT NOT NULL,
    item_id INT NOT NULL,
    quantidade INT NOT NULL,
    status ENUM('pendente', 'preparando', 'pronto', 'entregue') DEFAULT 'pendente',
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    personalizacao TEXT,
    FOREIGN KEY (item_id) REFERENCES menu(id)
);

-- Tabela de estoque
CREATE TABLE IF NOT EXISTS estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto VARCHAR(100) NOT NULL,
    validade DATE NOT NULL,
    quantidade INT NOT NULL,
    unidade ENUM('kg','litros','unidade','caixa') NOT NULL
);

-- Tabela de retiradas
CREATE TABLE IF NOT EXISTS retiradas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_nome VARCHAR(100) NOT NULL,
    usuario_matricula VARCHAR(50) NOT NULL,
    datahora DATETIME NOT NULL,
    produtos TEXT NOT NULL -- JSON com lista de produtos e quantidades
);

-- Tabela de movimentação financeira
CREATE TABLE IF NOT EXISTS financeiro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mesa INT,
    valor DECIMAL(10,2) NOT NULL,
    tipo_pagamento ENUM('dinheiro', 'pix', 'debito', 'credito') NOT NULL,
    tipo_movimentacao ENUM('entrada', 'saida') NOT NULL DEFAULT 'entrada',
    descricao VARCHAR(255),
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de caixa (opcional, se quiser separar do financeiro)
CREATE TABLE IF NOT EXISTS caixa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mesa INT,
    valor DECIMAL(10,2) NOT NULL,
    tipo ENUM('dinheiro', 'pix', 'debito', 'credito') NOT NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
);
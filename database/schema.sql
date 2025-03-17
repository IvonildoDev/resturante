CREATE DATABASE restaurante_db;
USE restaurante_db;

-- Tabela de itens do cardápio com coluna para imagem
CREATE TABLE menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    categoria ENUM('nordestino', 'pizza', 'bebida', 'sobremesa') NOT NULL,
    horario ENUM('dia', 'noite', 'ambos') DEFAULT 'ambos',
    imagem VARCHAR(255) -- Nome ou caminho da imagem (ex.: "baiao.jpg")
);

-- Tabela de pedidos (sem alterações)
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mesa INT NOT NULL,
    item_id INT NOT NULL,
    quantidade INT NOT NULL,
    status ENUM('pendente', 'preparando', 'pronto', 'entregue') DEFAULT 'pendente',
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES menu(id)
);

-- Inserção de exemplos com imagens
INSERT INTO menu (nome, descricao, preco, categoria, horario, imagem) VALUES
('Baião de Dois', 'Arroz, feijão-de-corda, carne seca e queijo coalho', 25.00, 'nordestino', 'dia', 'baiao-de-dois.png'),
('Carne de Sol com Macaxeira', 'Carne de sol, macaxeira frita e manteiga de garrafa', 30.00, 'nordestino', 'dia', 'carne_sol.jpg'),
('Pizza Margherita', 'Molho de tomate, muçarela e manjericão', 35.00, 'pizza', 'noite', 'pizza_margherita.jpg'),
('Pizza Calabresa', 'Calabresa, cebola e orégano', 38.00, 'pizza', 'noite', 'pizza_calabresa.jpg'),
('Coca-Cola', 'Refrigerante 350ml', 5.00, 'bebida', 'ambos', 'coca_cola.jpg'),
('Suco de Caju', 'Suco natural de caju', 7.00, 'bebida', 'ambos', 'suco_caju.jpg');
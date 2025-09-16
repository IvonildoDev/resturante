CREATE TABLE IF NOT EXISTS estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto VARCHAR(100) NOT NULL,
    validade DATE NOT NULL,
    quantidade INT NOT NULL,
    unidade ENUM('kg','litros','unidade','caixa') NOT NULL
);

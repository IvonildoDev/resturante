CREATE TABLE IF NOT EXISTS retiradas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_nome VARCHAR(100) NOT NULL,
    usuario_matricula VARCHAR(50) NOT NULL,
    datahora DATETIME NOT NULL,
    produtos TEXT NOT NULL -- JSON com lista de produtos e quantidades
);
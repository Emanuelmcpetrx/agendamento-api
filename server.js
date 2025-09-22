const express = require("express");
const cors = require("cors");
const path = require("path");
const { Client } = require("pg"); // Importa a classe Client do pacote pg

const app = express();
app.use(cors());
app.use(express.json());

// Servir os arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, "site_para_mobile")));

// Conexão com o banco de dados
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => console.log('Conectado ao banco de dados'))
  .catch(err => console.error('Erro ao conectar ao banco de dados', err));

// Criar a tabela se ela não existir
async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      telefone VARCHAR(255) NOT NULL,
      data DATE NOT NULL,
      hora TIME NOT NULL
    );
  `;
  try {
    await client.query(query);
    console.log("Tabela 'agendamentos' verificada ou criada com sucesso.");
  } catch (err) {
    console.error('Erro ao criar a tabela:', err);
  }
}
createTable();

// Rotas da API
app.post("/api/agendar", async (req, res) => {
  const { nome, telefone, data, hora } = req.body;
  const query = 'INSERT INTO agendamentos(nome, telefone, data, hora) VALUES($1, $2, $3, $4) RETURNING *';
  const values = [nome, telefone, data, hora];
  try {
    const result = await client.query(query, values);
    res.json({ message: "Agendamento salvo!", dados: result.rows[0] });
  } catch (err) {
    console.error('Erro ao salvar agendamento:', err);
    res.status(500).json({ message: "Erro ao salvar agendamento." });
  }
});

app.get("/api/agendamentos", async (req, res) => {
  const query = 'SELECT * FROM agendamentos ORDER BY id DESC';
  try {
    const result = await client.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar agendamentos:', err);
    res.status(500).json({ message: "Erro ao buscar agendamentos." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

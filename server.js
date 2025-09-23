const express = require("express");
const cors = require("cors");
const path = require("path");
const { Client } = require("pg");

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
      telefone VARCHAR(255),
      data DATE,
      servico VARCHAR(255),
      email VARCHAR(255),
      documento VARCHAR(255)
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
  const { nome, telefone, data, servico, email, cpf, cnpj } = req.body;
  const documento = cpf || cnpj || null;
  
  // Converte a data de dd/mm/aaaa para yyyy-mm-dd para salvar no banco de dados
  const [dia, mes, ano] = data.split("/");
  const dataFormatada = `${ano}-${mes}-${dia}`;
  
  const query = 'INSERT INTO agendamentos(nome, telefone, data, servico, email, documento) VALUES($1, $2, $3, $4, $5, $6) RETURNING *';
  const values = [nome, telefone, dataFormatada, servico, email, documento];
  
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

app.get("/api/agendamentos/:id", async (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM agendamentos WHERE id = $1';
  try {
    const result = await client.query(query, [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "Agendamento não encontrado." });
    }
  } catch (err) {
    console.error('Erro ao buscar agendamento:', err);
    res.status(500).json({ message: "Erro ao buscar agendamento." });
  }
});

app.put("/api/agendamentos/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, data, servico, email, documento } = req.body;
  
  // Converte a data de dd/mm/aaaa para yyyy-mm-dd para salvar no banco de dados
  const [dia, mes, ano] = data.split("/");
  const dataFormatada = `${ano}-${mes}-${dia}`;
  
  const query = 'UPDATE agendamentos SET nome = $1, telefone = $2, data = $3, servico = $4, email = $5, documento = $6 WHERE id = $7 RETURNING *';
  const values = [nome, telefone, dataFormatada, servico, email, documento, id];
  
  try {
    const result = await client.query(query, values);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "Agendamento não encontrado para edição." });
    }
  } catch (err) {
    console.error('Erro ao atualizar agendamento:', err);
    res.status(500).json({ message: "Erro ao atualizar agendamento." });
  }
});

app.delete("/api/agendamentos/:id", async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM agendamentos WHERE id = $1';
  try {
    const result = await client.query(query, [id]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: "Agendamento deletado com sucesso." });
    } else {
      res.status(404).json({ message: "Agendamento não encontrado para exclusão." });
    }
  } catch (err) {
    console.error('Erro ao deletar agendamento:', err);
    res.status(500).json({ message: "Erro ao deletar agendamento." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

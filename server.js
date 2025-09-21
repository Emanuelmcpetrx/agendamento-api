const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Servir seus arquivos HTML
app.use(express.static(path.join(__dirname)));

// Exemplo de rota de API para salvar agendamentos em memória
let agendamentos = [];

app.post("/api/agendar", (req, res) => {
  const dados = req.body;
  agendamentos.push(dados);
  res.json({ message: "Agendamento salvo!", dados });
});

app.get("/api/agendamentos", (req, res) => {
  res.json(agendamentos);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

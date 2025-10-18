const express = require('express');
const path = require('path');
const app = express();

const PORT = process.argv[2] || process.env.PORT || 3000;

// Serve os arquivos estáticos da pasta raiz do projeto
app.use(express.static(__dirname));

// Envia o index.html para qualquer outra requisição
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

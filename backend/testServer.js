const express = require('express');
const app = express();

app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

const PORT = 3002;
app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));
const express = require('express');
const app = express();
const app2=express();



// app.get('/api/data', (req, res) => {
  
//   setTimeout(() => {
//       res.send('Data from Service 1');
//   }, 1000);
// });
app.get('/api/data', (req, res) => {
  const data = { id: 1, name: 'Ramya' };
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Service 1 is running on port ${PORT}`);
});

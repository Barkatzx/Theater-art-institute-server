const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

// Middlewear
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Summer Camp Server Running')
  })
  
  app.listen(port, () => {
    console.log(`Summer Camp Server Running on port ${port}`);
  })
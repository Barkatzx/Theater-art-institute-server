const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l8fg5tj.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    const usersCollection = client.db('SummerDB').collection('users');


     // users related apis
     app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email }
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: 'User Already Exists'})
        }
        const result = await usersCollection.insertOne(user);
        res.status(201).json({ insertedId: result.insertedId });
      } catch (error) {
        console.error('Failed to save user:', error);
        res.status(500).json({ error: 'Failed to save user' });
      }
    });

    app.patch('users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Summer Camp Server Running');
});

app.listen(port, () => {
  console.log(`Summer Camp Server Running on port ${port}`);
});

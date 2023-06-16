const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }

  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // await client.connect();

    const usersCollection = client.db('SummerDB').collection('users');
    const classCollection = client.db("SummerDB").collection("class");
    const paymentCollection = client.db("SummerDB").collection("payment");
    const feedbackCollection = client.db("SummerDB").collection("feedback");
    const SelectClassCollection = client
      .db("SummerDB")
      .collection("select-class");

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })


    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

        const verifyInstructor = async (req, res, next) => {
          const email = req.decoded.email;
          const query = { email: email };
          const user = await usersCollection.findOne(query);
          if (user?.role !== "instructor") {
            return res
              .status(403)
              .send({ error: true, message: "Forbidden Access" });
          }
          next();
        };

        const verifyStudent = async (req, res, next) => {
          const email = req.decoded.email;
          const query = { email: email };
          const user = await usersCollection.findOne(query);
          if (user?.role !== "student") {
            return res
              .status(403)
              .send({ error: true, message: "Forbidden Access" });
          }
          next();
        };

        app.post("/selectClass", verifyJWT, async (req, res) => {
          const body = req.body;
          const result = await SelectClassCollection.insertOne(body);
          res.send(result);
        });

        app.get("/selectedClass", async (req, res) => {
          const email = req.query.email;
          console.log(email);
          if (!email) {
            res.send([]);
          }
          const query = { email: email };
          const result = await SelectClassCollection.find(query).toArray();
          res.send(result);
        });

        app.delete("/selectedClass/:id", async (req, res) => {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const result = await SelectClassCollection.deleteOne(query);
          res.send(result);
        });

        app.post("/feedback", async (req, res) => {
          const body = req.body;
          console.log(body);
          const result = await feedbackCollection.insertOne(body);
          res.send(result);
        });


     app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: 'User Already Exists' });
        }
    
        const { photoURL, ...userData } = user;
        userData.role = userData.role || 'student';
        userData.photoURL = photoURL || '';
    
        const result = await usersCollection.insertOne(userData);
        res.status(201).json({ insertedId: result.insertedId });
      } catch (error) {
        console.error('Failed to save user:', error);
        res.status(500).json({ error: 'Failed to save user' });
      }
    });
    
    

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })
    
    
    app.patch('/users/instructor/:id',async(req,res)=>{
      const id=req.params.id;
      const filter={_id:new ObjectId(id)}
      const updateDoc={
        $set:{
         role:'instructor'
        }
      }
      const result=await usersCollection.updateOne(filter,updateDoc)
      res.send(result)
    })
    

    app.patch('/users/admin/:id',async(req,res)=>{
      const id=req.params.id;
      const filter={_id:new ObjectId(id)}
      const updateDoc={
        $set:{
         role:'admin'
        }
      }
      const result=await usersCollection.updateOne(filter,updateDoc)
      res.send(result)
    })
    
    
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ instructor: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      res.send(result);
    })


    app.get('/users/student/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ student: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { student: user?.role === 'student' }
      res.send(result);
    })

    app.get("/users/instructor", async (req, res) => {
      const result = await usersCollection
        .find({ role: "instructor" })
        .toArray();
      res.send(result);
    });

    app.get("/users/student", async (req, res) => {
      const result = await usersCollection
        .find({ role: "student" })
        .toArray();
      res.send(result);
    });


    app.post("/class", verifyJWT, verifyInstructor, async (req, res) => {
      const newItem = req.body;
      const result = await classCollection.insertOne(newItem);
      res.send(result);
    });

    app.get("/class", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });

    app.get(
      "/class/instructor/:email",
      verifyJWT,

      async (req, res) => {
        const email = req.params.email;
        const result = await classCollection.find({ email: email }).toArray();
        res.send(result);
      }
    );
    app.patch("/class/approved/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateClass = req.body;
      const updateDoc = {
        $set: {
          status: updateClass.status,
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.patch("/class/deny/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateClass = req.body;
      const updateDoc = {
        $set: {
          status: updateClass.status,
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;
      if (price <= 0) {
        return res.send({});
      }
      const amount = parseInt(price * 100);
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ error: "Failed to create payment intent" });
      }

    });
        



    //payment details post api
    app.post("/payment", async (req, res) => {
      const body = req.body;
      console.log(body);
      const InsertResult = await paymentCollection.insertOne(body);

      const query = {
        _id: { $in: body.classId.map((id) => new ObjectId(id)) },
      };
      const deleteResult = await classCollection.deleteMany(query);
      res.send({ InsertResult, deleteResult });
    });

    //payment history api
    app.get("/payment", verifyJWT, async (req, res) => {
      const email = req.query.email;
      console.log(email);
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });




    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Summer Camp Server is Running');
});

app.listen(port, () => {
  console.log(`Summer Camp Server Running on port ${port}`);
});

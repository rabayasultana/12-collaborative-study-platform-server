require('dotenv').config();
const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 9000;


// Middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mwqipy1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  async function run() {
    try {
    
      // session collection
      const sessionCollection = client.db("studyPlatformDB").collection("session");

      app.get('/session', async(req, res) =>{
        const result = await sessionCollection.find().toArray();
        res.send(result);
      })


      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
   
    }
  }
  run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from Study Platform server....')
} )

app.listen(port, () => console.log(`Server running on port ${port}`))
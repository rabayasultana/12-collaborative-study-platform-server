require('dotenv').config();
const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
      // materials collection
      const materialsCollection = client.db("studyPlatformDB").collection("materials");

      // get session data
      app.get('/session', async(req, res) =>{
        const result = await sessionCollection.find().toArray();
        res.send(result);
      })

      // post session data
      app.post('/session', async(req, res) =>{
        const sessionItem = req.body;
        const result = await sessionCollection.insertOne(sessionItem);
        res.send(result);
      })

      // Get approved sessions by email and status
app.get('/approvedSessions', async (req, res) => {
  const { email } = req.query; // Get email from query parameters

  if (!email) {
      return res.status(400).send({ error: 'Email is required.' });
  }

  try {
      // Query to find approved sessions for the given email
      const query = { tutorEmail: email, status: 'approved' };
      const approvedSessions = await sessionCollection.find(query).toArray();

      res.send(approvedSessions); // Send the retrieved sessions back to the client
  } catch (error) {
      console.error('Error fetching approved sessions:', error);
      res.status(500).send({ error: 'Failed to fetch approved sessions.' });
  }
});


      // get materials data
      app.get('/materials', async(req, res) =>{
        const result = await materialsCollection.find().toArray();
        res.send(result);
      })

      // post materials data
      app.post('/materials', async(req, res) =>{
        const material = req.body;
        const result = await materialsCollection.insertOne(material);
        res.send(result);
      })

      // app.get('/materials/:id', async (req, res) => {
      //   const id = req.params.id;
      //   const query = { _id: new ObjectId(id) }
      //   const result = await materialsCollection.findOne(query);
      //   res.send(result)
      // })


      // update materials by id
      app.patch('/materials/:id', async (req, res) => {
        const item = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id)}
        const updatedDoc = {
          $set: {
            title: item.title,
            driveLinks: item.driveLinks,
            imageUrls: item.imageUrls
          }
        }
        const result = await materialsCollection.updateOne(filter, updatedDoc)
        res.send(result)
      })

      // delete materials by id
      app.delete('/materials/:id', async (req,res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id)}
        const result = await materialsCollection.deleteOne(query);
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
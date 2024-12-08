require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 9000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mwqipy1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // session collection
    const userCollection = client
      .db("studyPlatformDB")
      .collection("users");
    // session collection
    const sessionCollection = client
      .db("studyPlatformDB")
      .collection("session");
    // materials collection
    const materialsCollection = client
      .db("studyPlatformDB")
      .collection("materials");

        // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

        // middlewares 
        const verifyToken = (req, res, next) => {
          console.log('inside verify token', req.headers.authorization);
          if (!req.headers.authorization) {
            return res.status(401).send({ message: 'unauthorized access' });
          }
          const token = req.headers.authorization.split(' ')[1];
          jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
              return res.status(401).send({ message: 'unauthorized access' })
            }
            req.decoded = decoded;
            next();
          })
        }

      // users related api
      // get users data
      // app.get("/users", async (req, res) => {
      //   const result = await userCollection.find().toArray();
      //   res.send(result);
      // })

      app.get("/users", verifyToken,  async (req, res) => {
          const search = req.query.search || ""; // Retrieve search query parameter
          let query = {};
      
          if (search) {
            // Add search conditions if search query exists
            query = {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
              ],
            };
          }
      
          // Fetch users from the database based on the query
          const users = await userCollection.find(query).toArray();
          res.send(users); // Send users to the client
      });
      

      // update user role
      app.patch('/users/role/:id', async (req, res) => {
        const id = req.params.id;
        const { role } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = { $set: { role } }
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      })

      // delete users
      app.delete('/users/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await userCollection.deleteOne(query);
        res.send(result);
      })
  
      // post users data
      app.post("/users", async (req, res) => {
        const user = req.body;
        const query = { email: user.email }
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: 'user already exists', insertedId: null })
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
      });


    // get session data
    app.get("/session", async (req, res) => {
      const result = await sessionCollection.find().toArray();
      res.send(result);
    });

    app.get("/session/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sessionCollection.findOne(query);
      res.send(result);
      console.log(result);
    });

    // post session data
    app.post("/session", async (req, res) => {
      const sessionItem = req.body;
      const result = await sessionCollection.insertOne(sessionItem);
      res.send(result);
    });

    // update session
    app.patch("/session/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: item.status,
          fee: item.fee,
          title: item.title,
          description: item.description,
          registrationStart: item.registrationStart,
          registrationEnd: item.registrationEnd,
          classStart: item.classStart,
          classEnd: item.classEnd,
          duration: item.duration,
        },
      };
      const result = await sessionCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

        // delete session by id
        app.delete("/session/:id", async (req, res) => {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const result = await sessionCollection.deleteOne(query);
          res.send(result);
        });


    // // update sessions by id
    // app.patch("/updateSession/:id", async (req, res) => {
    //   const item = req.body;
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   const updatedDoc = {
    //     $set: {
    //       title: item.title,
    //     },
    //   };
    //   const result = await sessionCollection.updateOne(filter, updatedDoc);
    //   res.send(result);
    // });

    // Get approved sessions by email and status
    app.get("/approvedSessions", async (req, res) => {
      const { email } = req.query; // Get email from query parameters

      if (!email) {
        return res.status(400).send({ error: "Email is required." });
      }

      try {
        // Query to find approved sessions for the given email
        const query = { tutorEmail: email, status: "approved" };
        const approvedSessions = await sessionCollection.find(query).toArray();

        res.send(approvedSessions); // Send the retrieved sessions back to the client
      } catch (error) {
        console.error("Error fetching approved sessions:", error);
        res.status(500).send({ error: "Failed to fetch approved sessions." });
      }
    });


    // get materials data
    app.get("/materials", async (req, res) => {
      const result = await materialsCollection.find().toArray();
      res.send(result);
    });

    // post materials data
    app.post("/materials", async (req, res) => {
      const material = req.body;
      const result = await materialsCollection.insertOne(material);
      res.send(result);
    });

    app.get('/materials/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await materialsCollection.findOne(query);
      res.send(result)
    })

    app.get("/tutorMaterials", async (req, res) => {
      const { email } = req.query; // Get email from query parameters
    
      if (!email) {
        return res.status(400).send({ error: "Email is required." });
      }
    
      try {
        // Query to find materials for the given tutor email
        const query = { tutorEmail: email };
        const tutorMaterials = await materialsCollection.find(query).toArray();
    
        // Send the retrieved materials back to the client
        res.send(tutorMaterials);
      } catch (error) {
        console.error("Error fetching materials:", error);
        res.status(500).send({ error: "Failed to fetch materials." });
      }
    });
    

    // update materials by id
    app.patch("/materials/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: item.title,
          driveLinks: item.driveLinks,
          imageUrls: item.imageUrls,
        },
      };
      const result = await materialsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // delete materials by id
    app.delete("/materials/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await materialsCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from Study Platform server....");
});

app.listen(port, () => console.log(`Server running on port ${port}`));

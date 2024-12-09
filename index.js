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

    // Booked session collection
    const bookedSessionCollection = client
      .db("studyPlatformDB")
      .collection("bookedSession");

    // materials collection
    const materialsCollection = client
      .db("studyPlatformDB")
      .collection("materials");

    // notes collection
    const noteCollection = client
      .db("studyPlatformDB")
      .collection("notes");

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

         // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

     // use verify tutor after verifyToken
     const verifyTutor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isTutor = user?.role === 'tutor';
      if (!isTutor) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

         // use verify student after verifyToken
         const verifyStudent = async (req, res, next) => {
          const email = req.decoded.email;
          const query = { email: email };
          const user = await userCollection.findOne(query);
          const isStudent = user?.role === 'student';
          if (!isStudent) {
            return res.status(403).send({ message: 'forbidden access' });
          }
          next();
        }

    // verify Tutor or admin
    // const verifyTutorOrAdmin = async (req, res, next) => {
    //   const email = req.decoded.email;
    //   const query = { email: email };
    //   const user = await userCollection.findOne(query);
    //   const isAdmin = user?.role === 'admin';
    //   const isTutor = user?.role === 'tutor';

    //   if (!isTutor || !isAdmin) {
    //     return res.status(403).send({ message: 'forbidden access' });
    //   }
    //   next();
    // }
    

      // users related api
      // get users data
      // app.get("/users", async (req, res) => {
      //   const result = await userCollection.find().toArray();
      //   res.send(result);
      // })

      // view all users
      app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
          const search = req.query.search || ""; // Retrieve search query parameter
          let query = {};
      
          if (search) {
            query = {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
              ],
            };
          }
          const users = await userCollection.find(query).toArray();
          res.send(users); 
      });

      // check if admin or not
      app.get('/users/admin/:email', verifyToken, async (req, res) => {
        const email = req.params.email;
  
        if (email !== req.decoded.email) {
          return res.status(403).send({ message: 'forbidden access' })
        }
  
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let admin = false;
        if (user) {
          admin = user?.role === 'admin';
        }
        res.send({ admin });
      })

            // check if tutor or not
            app.get('/users/tutor/:email', verifyToken, async (req, res) => {
              const email = req.params.email;
        
              if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
              }
        
              const query = { email: email };
              const user = await userCollection.findOne(query);
              let tutor = false;
              if (user) {
                tutor = user?.role === 'tutor';
              }
              res.send({ tutor });
            })

             // check if student or not
             app.get('/users/student/:email', verifyToken, async (req, res) => {
              const email = req.params.email;
        
              if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
              }
        
              const query = { email: email };
              const user = await userCollection.findOne(query);
              let student = false;
              if (user) {
                student = user?.role === 'student';
              }
              res.send({ student });
            })
      

      // update user role
      app.patch('/users/role/:id', verifyToken, verifyAdmin, async (req, res) => {
        const id = req.params.id;
        const { role } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = { $set: { role } }
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      })

      // delete users
      app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
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
    app.post("/session", verifyToken, verifyTutor, async (req, res) => {
      const sessionItem = req.body;
      const result = await sessionCollection.insertOne(sessionItem);
      res.send(result);
    });

    // update session
    app.patch("/session/:id", verifyToken, async (req, res) => {
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

  
    // Get approved sessions by email and status
    app.get("/approvedSessions", verifyToken, verifyTutor, async (req, res) => {
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

       // booked session
       app.post("/bookedSession", verifyToken, verifyStudent, async (req, res) => {
        const item = req.body;
        const result = await bookedSessionCollection.insertOne(item);
        res.send(result);
      });

      // get booked session
       // Get booked sessions by email and sessionId or only by email
       app.get("/bookedSessions", verifyToken, verifyStudent, async (req, res) => {
        const { studentEmail, sessionId } = req.query; // Get parameters from query string
      
        // Validate required query parameters
        if (!studentEmail) {
          return res.status(400).send({ error: "Student email is required." });
        }
      
        try {
          // Build query dynamically based on available parameters
          const query = { studentEmail };
          if (sessionId) {
            query.sessionId = sessionId;
          }
      
          // Query the database for booked sessions matching the given criteria
          const bookedSessions = await bookedSessionCollection.find(query).toArray();
      
          res.status(200).send(bookedSessions); // Respond with the retrieved sessions
        } catch (error) {
          console.error("Error fetching booked sessions:", error);
          res.status(500).send({ error: "Failed to fetch booked sessions." });
        }
      });
      
      

    // get materials data
    app.get("/materials", async (req, res) => {
      const result = await materialsCollection.find().toArray();
      res.send(result);
    });

    // post materials data
    app.post("/materials", verifyToken, verifyTutor, async (req, res) => {
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

    app.get("/tutorMaterials", verifyToken, verifyTutor, async (req, res) => {
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


        // // get notes data
        // app.get("/note", async (req, res) => {
        //   const result = await noteCollection.find().toArray();
        //   res.send(result);
        // });

    // note related api
           app.post("/note", verifyToken, verifyStudent, async (req, res) => {
            const item = req.body;
            const result = await noteCollection.insertOne(item);
            res.send(result);
          });



// get notes by email
          app.get("/notes", verifyToken, verifyStudent, async (req, res) => {
            const { studentEmail } = req.query; // Get parameters from query string
          
            // Validate required query parameters
            if (!studentEmail) {
              return res.status(400).send({ error: "studentEmail are required." });
            }
          
            try {
              // Query the database for booked sessions matching the given email and session ID
              const query = { studentEmail };
              const notes = await noteCollection.find(query).toArray();
          
              res.status(200).send(notes); // Respond with the retrieved sessions
            } catch (error) {
              console.error("Error fetching notes:", error);
              res.status(500).send({ error: "Failed to fetch notes." });
            }
          });

          // delete note
          app.delete("/notes/:id", verifyToken, verifyStudent, async (req, res) => {
            const { id } = req.params;
            const result = await noteCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
          });

          // update note
          app.patch("/notes/:id", verifyToken, verifyStudent, async (req, res) => {
            const { id } = req.params;
            const { title, description } = req.body;
          
            const result = await noteCollection.updateOne(
              { _id: new ObjectId(id) },
              { $set: { title, description } }
            );
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

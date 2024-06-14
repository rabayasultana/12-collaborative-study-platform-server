require('dotenv').config();
const express = require('express')
const cors = require('cors')
// const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 9000


// Middleware
app.use(cors())
app.use(express.json())





app.get('/', (req, res) => {
    res.send('Hello from Study Platform server....')
} )

app.listen(port, () => console.log(`Server running on port ${port}`))
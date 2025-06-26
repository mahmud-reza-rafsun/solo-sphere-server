const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const port = process.env.PORT || 5000;
const app = express();

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uuac6m8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // jobs collection
    const jobsCollections = client.db('soloDB').collection('jobs');

    // save all jobsData in db
    app.post('/add-job', async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollections.insertOne(jobData);
      console.log(result);
      res.send(result);
    })

    // get all data
    app.get('/jobs', async (req, res) => {
      const result = await jobsCollections.find().toArray();
      res.send(result);
    })
    // get all jobs posted by a specific user
    app.get('/jobs/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'buyer.email': email }
      const result = await jobsCollections.find(query).toArray();
      res.send(result);
    })
    // delete single data form my posted jobs
    app.delete('/job/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID format" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollections.deleteOne(query)
      res.send(result);
    })
    // get a single job data form db
    app.get('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollections.findOne(query);
      res.send(result);
    })
    // update a job data in db
    app.put('/update-job/:id', async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const updatedDoc = {
        $set: jobData,
      }
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID format" });
      }
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const result = await jobsCollections.updateOne(filter, updatedDoc, option);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello from Solo Sphere Server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))

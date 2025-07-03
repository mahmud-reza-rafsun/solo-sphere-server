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
    // await client.connect();
    // jobs collection
    const jobsCollections = client.db('soloDB').collection('jobs');
    const bidsCollections = client.db('soloDB').collection('bids');

    // save all jobsData in db
    app.post('/add-job', async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollections.insertOne(jobData);
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
    // save all bids in db
    app.post('/add-bid', async (req, res) => {
      const bidsData = req.body;
      // if a user placed a bid already in this job
      console.log(bidsData);
      const query = { email: bidsData.email, jobId: bidsData.jobId };
      const alreadyExist = await bidsCollections.findOne(query)
      if(alreadyExist) return res.status(400).send('You are already placed a bid for this job!')
      console.log('if already exitis ==>', alreadyExist);
      console.log(query);
      // save data in bids collection
      const result = await bidsCollections.insertOne(bidsData);
      // increse bid count in job collection 
      const filter = { _id: new ObjectId(bidsData.jobId) };
      const update = {
        $inc: { bidCount: 1, }
      }
      const updateBidCount = await jobsCollections.updateOne(filter, update)
      res.send(result);
    })
    // get bids data for a specific user
    app.get('/bids/:email', async (req, res) => {
      const isbuyer = req.query.buyer;
      const email = req.params.email;
      const query = {};
      if (isbuyer) {
        query.buyer = email
      }
      else{
        query.email = email
      }
      const result = await bidsCollections.find(query).toArray();
      res.send(result);
    })
    app.patch('/bid-status-update/:id', async (req, res) => {
      const id = req.params.id;
      const {status} = req.body;
      const filter = {_id: new ObjectId(id)};
      const update = {
        $set: {status},
      }
      const result = await bidsCollections.updateOne(filter, update);
      res.send(result);
    })
    // get all jobs
    app.get('/all-jobs', async(req, res) => {
      const filter = req.query.filter;
      const search = req.query.search;
      const sort = req.query.sort;
      let options = {}
      if(sort) options = {sort: {deadline: sort === 'asc' ? 1 : -1}}
      let query = {title: {
        $regex: search,
        $options: 'i',
      }}
      if(filter) query.category = filter;
      const result = await jobsCollections.find(query, options).toArray();
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
  res.send('Hello from Solo Fibu Server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))

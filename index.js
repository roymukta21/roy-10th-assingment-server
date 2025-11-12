const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URI
const uri =
  "mongodb+srv://StudyMate:J0VPuryuatS05GWC@roycluster.xla8ebs.mongodb.net/?appName=RoyCluster";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("StudyMate Server is Running Successfully!");
});

async function run() {
  try {
    await client.connect();

    const db = client.db("StudyMate_DB");
    const partnersCollection = db.collection("Partners");
    const connectionsCollection = db.collection("Connections");

    
    //  CREATE Partner Profile
   
    app.post("/partners", async (req, res) => {
      const newProfile = req.body;
      const result = await partnersCollection.insertOne(newProfile);
      res.send(result);
    });

   
    //  READ All Partners 
    app.get("/partners", async (req, res) => {
      const { search, sort } = req.query;
      let query = {};

      // Search by subject 
      if (search) {
        query.subject = { $regex: search, $options: "i" };
      }

      // Sort by Experience Level 
      let sortOption = {};
      if (sort === "asc") {
        sortOption = { experienceLevel: 1 };
      } else if (sort === "desc") {
        sortOption = { experienceLevel: -1 };
      }

      const cursor = partnersCollection.find(query).sort(sortOption);
      const result = await cursor.toArray();
      res.send(result);
    });

    
    //  READ Single Partner Details
   
    app.get("/partners/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await partnersCollection.findOne(query);
      res.send(result);
    });

    
    //  UPDATE Partner Profile
   
    app.patch("/partners/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updatedData.name,
          subject: updatedData.subject,
          studyMode: updatedData.studyMode,
          availabilityTime: updatedData.availabilityTime,
          location: updatedData.location,
          experienceLevel: updatedData.experienceLevel,
          rating: updatedData.rating,
        },
      };
      const result = await partnersCollection.updateOne(query, update);
      res.send(result);
    });

    
    //  DELETE Partner Profile
    
    app.delete("/partners/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await partnersCollection.deleteOne(query);
      res.send(result);
    });

    
    //  Send Partner Request 
    app.post("/connections", async (req, res) => {
      const request = req.body;
      const { partnerId, senderEmail } = request;

      // Check for duplicate request
      const existingRequest = await connectionsCollection.findOne({
        partnerId: partnerId,
        senderEmail: senderEmail,
      });

      if (existingRequest) {
        return res.status(400).send({ message: "Request already sent!" });
      }

      // Increment partner count
      const partnerQuery = { _id: new ObjectId(partnerId) };
      const update = { $inc: { partnerCount: 1 } };
      await partnersCollection.updateOne(partnerQuery, update);

      // Save connection data
      const result = await connectionsCollection.insertOne(request);
      res.send(result);
    });

    
    //  Get My Connections
   
    app.get("/connections", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query.senderEmail = email;
      }
      const result = await connectionsCollection.find(query).toArray();
      res.send(result);
    });

    
    //  UPDATE Connection 
    app.patch("/connections/:id", async (req, res) => {
      const id = req.params.id;
      const updatedInfo = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updatedInfo.name,
          subject: updatedInfo.subject,
          studyMode: updatedInfo.studyMode,
          location: updatedInfo.location,
        },
      };
      const result = await connectionsCollection.updateOne(query, update);
      res.send(result);
    });

    
    //  DELETE Connection
    
    app.delete("/connections/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await connectionsCollection.deleteOne(query);
      res.send(result);
    });

   
    //  GET Top Rated Partners 
    app.get("/top-partners", async (req, res) => {
      const cursor = partnersCollection.find().sort({ rating: -1 }).limit(3);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Test connection
    await client.db("admin").command({ ping: 1 });
    console.log(" Connected to MongoDB successfully for StudyMate!");
  } finally {
    // await client.close(); // keep open for deployment
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`StudyMate server running on port: ${port}`);
});

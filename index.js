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
    // await client.connect();

    const db = client.db("StudyMate");
    const partnersCollection = db.collection("Partners");
    const connectionsCollection = db.collection("Connections");

    //  CREATE Partner Profile
    app.post("/partners", async (req, res) => {
      try {
        const newProfile = req.body;

        if (!newProfile.name || !newProfile.email) {
          return res
            .status(400)
            .send({ message: "Name and email are required!" });
        }

        const result = await partnersCollection.insertOne({
          ...newProfile,
          rating: newProfile.rating || 0,
          partnerCount: newProfile.partnerCount || 0,
        });

        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to create partner profile", error: err });
      }
    });

    //  READ All Partners
    app.get("/partners", async (req, res) => {
      try {
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
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to fetch partners", error: err });
      }
    });

    //  READ Single Partner Details
    app.get("/partners/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID format" });
        }

        const query = { _id: new ObjectId(id) };
        const result = await partnersCollection.findOne(query);

        if (!result) {
          return res.status(404).send({ message: "Partner not found" });
        }

        res.send(result);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to fetch partner details", error: err });
      }
    });

    //  UPDATE Partner Profile
    app.patch("/partners/:id", async (req, res) => {
      try {
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
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to update partner profile", error: err });
      }
    });

    //  DELETE Partner Profile
    app.delete("/partners/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await partnersCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to delete partner profile", error: err });
      }
    });

    //  Send Partner Request
    app.post("/connections", async (req, res) => {
      try {
        const request = req.body;
        const { partnerId, senderEmail, message } = request;

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

        // Prepare connection data
        const connectionData = {
          ...request,
          message: message || "No message added",
          sentAt: new Date(),
        };

        // Save connection data
        const result = await connectionsCollection.insertOne(connectionData);
        res.send(result);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to send partner request", error: err });
      }
    });

    //  Get My Connections
    app.get("/connections", async (req, res) => {
      try {
        const email = req.query.email;
        let query = {};
        if (email) {
          query.senderEmail = email;
        }
        const result = await connectionsCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to fetch connections", error: err });
      }
    });

    // ✅ UPDATE Connection
    app.put("/connections/:_id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedInfo = req.body;

        console.log("🟡 Incoming PUT Request jj for:", id);
    console.log("🟢 Body Data:", updatedInfo);

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            subject: updatedInfo.subject,
            studyMode: updatedInfo.studyMode,
          },
        };

        const result = await connectionsCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount > 0) {
          res.send({
            success: true,
            message: "Connection updated successfully",
          });
        } else {
          res.send({ success: false, message: "No changes made" });
        }
      } catch (error) {
        console.error("Error updating connection:", error);
        res.status(500).send({ error: "Failed to update connection" });
      }
    });

    //  DELETE Connection
    app.delete("/connections/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await connectionsCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to delete connection", error: err });
      }
    });

    //  GET Top Rated Partners
    app.get("/top-partners", async (req, res) => {
      try {
        const cursor = partnersCollection.find().sort({ rating: -1 }).limit(3);
        const result = await cursor.toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to fetch top partners", error: err });
      }
    });

    // Test connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB successfully for StudyMate!");
  } finally {
    // await client.close(); // keep open for deployment
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`StudyMate server running on port: ${port}`);
});

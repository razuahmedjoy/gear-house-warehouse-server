const express = require('express');

// added it for cors 
const cors = require('cors');

// added to configure secret keys
require('dotenv').config()

const app = express();
const port = process.env.PORT || 8000

app.use(cors());
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const res = require('express/lib/response');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mwock.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function dbConnect() {
    try {

        await client.connect();
        const inventoryCollection = client.db("gearHouse").collection("inventory");

        // all apis

        // get all inventories
        app.get('/inventories', async (req, res) => {
            const query = {};

            const limitItem = parseInt(req.query.limit)
            const page = parseInt(req.query.page)
            const count = req.query.count;

            if (count) {

                // this block will only return total Inventory counts
                const query = {};
                const totalCount = await inventoryCollection.countDocuments(query);
                res.send({totalCount})
               
            }
            else if(page){
                
            }
            else {
                const cursor = inventoryCollection.find(query);


                if (limitItem) {

                    const inventories = await cursor.limit(limitItem).toArray();

                    res.send(inventories);



                } else {

                    const inventories = await cursor.toArray();
                    res.send(inventories);
                }
            }

        })

        // get single inventory by id.
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id),
            }

            const result = await inventoryCollection.findOne(query);
            res.send(result)
        })

        // delivered and reduce quantity by 1:
        app.get('/delivered/:id', async (req, res) => {

            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const foundItem = await inventoryCollection.findOne(filter);
            const newQty = parseInt(foundItem.quantity) - 1

            const options = { upsert: true, }
            const updateDoc = {
                $set: {
                    quantity: newQty
                }
            }

            const result = await inventoryCollection.updateOne(filter, updateDoc, options)

            res.send(result)


        })

        // update quantity by id
        app.post('/update/:id', async (req, res) => {
            const id = req.params.id;
            const { qty } = req.body;

            const filter = {
                _id: ObjectId(id),
            }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    quantity: qty,

                }
            }

            const result = await inventoryCollection.updateOne(filter, updateDoc, options)

            res.send(result)
        })


        // add inventory
        app.post('/additem', async (req, res) => {

            const data = req.body;

            const result = await inventoryCollection.insertOne(data)

            res.send(result)
        })


        // delete an inventory
        app.post('/delete', async (req, res) => {
            const id = req.body.id;
            const query = {
                _id: ObjectId(id)
            }

            const result = await inventoryCollection.deleteOne(query);

            res.send(result);
        })


    }
    finally {

    }
}

dbConnect().catch(console.dir)

app.get('/', (req, res) => {
    res.send("Database cconnected");
})

app.listen(port, () => {
    console.log(`Server running at following url http://localhost:${port}`)
});
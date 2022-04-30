const express = require('express');

// added it for cors 
const cors = require('cors');

// added to configure secret keys
require('dotenv').config()

const app = express();
const port = process.env.PORT || 8000

app.use(cors());
app.use(express.json())



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mwock.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function dbConnect(){
    try{

        await client.connect();
        const inventoryCollection = client.db("gearHouse").collection("inventory");

        // all apis
        app.get('/inventories', async (req,res)=>{
            const query = {};

            const cursor = inventoryCollection.find(query);

            const inventories = await cursor.limit(6).toArray();
            res.send(inventories);
        })

   

    }
    finally{
       
    }
}

dbConnect().catch(console.dir)

app.get('/', (req, res) => {
    res.send("Database cconnected");
})

app.listen(port, () => {
    console.log(`Server running at following url http://localhost:${port}`)
});
const express = require('express');

// added it for cors 
const cors = require('cors');

const jwt = require('jsonwebtoken')

// added to configure secret keys
require('dotenv').config()

const app = express();
const port = process.env.PORT || 8000

app.use(cors());
app.use(express.json())

// verifyJWTTOken before sending inventories by user

function veryJwtToken(req,res,next) {

    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'UnAuthorized Access'})

    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,decoded) => {
        if(err){
            return res.status(403).send({message: 'Access Forbidden'});
        }
        req.decoded = decoded;
        next();
    })
}



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const res = require('express/lib/response');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mwock.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function dbConnect() {
    try {

        await client.connect();
        const inventoryCollection = client.db("gearHouse").collection("inventory");



        // JWT TOken signing...
        app.post('/get-token', async (req, res)=>{

            // to generate SECRET_SIGN_KEY
            // require('crypto').randomBytes(64).toString('hex')
            const user = req.body;
            const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'})
            
            res.send({accessToken})


        })

         // get inventories by user
        //  SECURE API by JWT

         app.post('/my-inventories',veryJwtToken, async (req, res)=>{

            const decodedemail = req.decoded.email;
            
            const email = req.body.email;

            const page = req.query.page
            const perpage = parseInt(req.query.perpage)

            // console.log(email)
            // console.log(decodedemail)

            if(email === decodedemail){

                const filter = {
                    user_email : req.body.email,
    
                }
                const cursor = inventoryCollection.find(filter);

                if(page && perpage){


                    
                    const inventories = await cursor.skip(parseInt(page)*perpage).limit(perpage).toArray()
    
                    
                    res.send(inventories)
                    
                    
                }
                else{
                    
                    const inventories = await cursor.toArray();
        
                    res.send(inventories);
                }

            }
            else{
                res.status(403).send({message:"Forbidden access"});
            }
            


        })

        // all apis

        // get all inventories
        app.get('/inventories', async (req, res) => {
            const query = {};

            const limitItem = parseInt(req.query.limit)
            const page = req.query.page
            const perpage = parseInt(req.query.perpage)
            const count = req.query.count;
            

            if (count) {

                // this block will only return total Inventory counts
                const totalCount = await inventoryCollection.countDocuments(query);
                res.send({totalCount})
               
            }
            else if(page && perpage){


                const cursor = inventoryCollection.find(query);
                const inventories = await cursor.skip(parseInt(page)*perpage).limit(perpage).toArray()

                
                res.send(inventories)
                
                
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
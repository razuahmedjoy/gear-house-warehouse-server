const express = require('express');
const app = express();
const port = process.env.PORT || 8000


app.get('/', (req, res) => {
    res.send("Hello server running");
})

app.listen(port,()=>{
    console.log(`Server running at following url http://localhost:${port}`)
});
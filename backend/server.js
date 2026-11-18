const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db')
require('dotenv').config();


const app = express();

app.use(express.json());
app.use(cors());

app.get('/',(req,res) =>{
    res.send("Smart School Connect Backend is running!");
})

const PORT = process.env.PORT || 5000;

const startServer = async () =>{
    try{
        await connectDB();

        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on PORT ${PORT}`)
        })
    }
    catch(error){
        console.log("Failed to start server:",error)
        process.exit(1);
    }
}

startServer();


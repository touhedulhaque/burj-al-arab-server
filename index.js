const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ujfln.mongodb.net/burj-al-arab-demo?retryWrites=true&w=majority`;
const port = 5000;

const app = express();

app.use(cors());
app.use(bodyParser.json());


var serviceAccount = require("./configs/burj-al-arab-demo-firebase-adminsdk-if1kl-2ca5d30044.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burj-al-arab-demo").collection("bookingInfo");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    let tokenEmail = decodedToken.email;
                   if(tokenEmail == req.query.email){
                    bookings.find({email: req.query.email})
                    .toArray( (err, documents)=>{
                        res.status(200).send(documents)
                    })
                   }
                   else{
                    res.status(401).send('UnAuthorized Action')
                   }
                }).catch(function (error) {
                    // Handle error
                });

        }
        else {
            res.status(401).send('UnAuthorized Access')
        }  
    })
});

app.listen(port);
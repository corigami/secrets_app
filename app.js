//npm modules
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require('md5');

/* ---------------Database Configuration ------------*/
const DB_SERV = process.env.DB_SERV;
const DB_PORT = process.env.DB_PORT;
const DB = process.env.DB;
const DB_URI = DB_SERV + DB_PORT + DB;
mongoose.connect(DB_URI);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);    //using default mongoose connection

/* ---------------Express Configuration ------------*/
const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.listen(PORT, function () {
    console.log("Server started on port " + PORT);
});


/* ------------------Routes ---------------*/
app.get("/", (req, res) => {
    res.render("home");
})
app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        const username = req.body.username;
        const password = md5(req.body.password);

        User.findOne({email: username}, (err,result)=>{
            if(err){
                res.send(err);
            }else{
                if(result && result.password === password){
                    res.render("secrets");
                }
            }
        });
    });

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })

    .post((req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: md5(req.body.password)
        });

        newUser.save()
            .then(() => {
                res.render("secrets")
            })
            .catch((err) => {
                res.send(err);
            });
    });

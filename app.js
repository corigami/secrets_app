//npm modules
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

/* ---------------Database Configuration ------------*/
const DB_PORT = 27017;
const DB_URI = "mongodb://localhost:" + DB_PORT + "/userdb";
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
        const password = req.body.password;

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
            password: req.body.password
        });

        newUser.save()
            .then(() => {
                res.render("secrets")
            })
            .catch((err) => {
                res.send(err);
            });
    });

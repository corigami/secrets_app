//npm modules
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt")
const saltRounds = 12;

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
        const password = req.body.password;

        User.findOne({ email: username }, (err, result) => {
            if (err) {
                res.send(err);
            } else {
                if (result) {
                    bcrypt.compare(password, result.password, (compErr, compRes) => {
                        if (compErr) {                        //Log error
                            console.log(compErr)
                        } else if (!compRes) {
                            res.send("Invalid Password");   //Invalid Password
                        } else {
                            res.render("secrets");          //No errors, password checks out
                        }
                    });
                }
            }
        });
    });

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })

    .post((req, res) => {
        bcrypt.hash(req.body.password, saltRounds, (hashError, hash) => {
            if (!hashError) {
                const newUser = new User({
                    email: req.body.username,
                    password: hash
                });

                newUser.save()
                    .then(() => {
                        res.render("secrets")
                    })
                    .catch((save_err) => {
                        console.log("Error saving password Hash...")
                        res.send(save_err);
                    });
            } else {
                console.log("Error Hashing Password...")
                console.log(hashError)
            }
        });
    });

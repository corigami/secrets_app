//npm modules
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

/* ---------------Express Configuration ------------*/
const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



//configure express-session 
app.use(session({
    secret: process.env.EXP_SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: false }
}));

//configure passport.  Order is import.  Must init passport first, then tell express to use the session defined above.
app.use(passport.initialize());
app.use(passport.session());

/* ---------------Database Configuration ------------*/
const DB_SERV = process.env.DB_SERV;
const DB_PORT = process.env.DB_PORT;
const DB = process.env.DB;
const DB_URI = DB_SERV + DB_PORT + DB;
mongoose.connect(DB_URI);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String
});
//add passportLocalMongoose to handle (de)serialization of session credentials
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//create user model and configure passport to use passportLocalMongoose
const User = mongoose.model("User", userSchema);    //using default mongoose connection
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});


//configure passport to use google oauth
passport.use(new GoogleStrategy({
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        //We are using mongoose-findorcreate package to add findOrCreate method rather than redefining...
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.listen(PORT, function () {
    console.log("Server started on port " + PORT);
});


/* ------------------Routes ---------------*/
app.get("/", (req, res) => {
    res.render("home");
})

app.route("/auth/google")
    .get(
        passport.authenticate("google", { scope: ["profile"] })
    );

//authorized redirect route as specified in OAUTH Client Setup
app.route("/auth/google/secrets")
    .get(
        passport.authenticate("google", { failureRedirect: "/login" }),
        (req, res) => {
            res.redirect("/secrets");
        });

app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        const user = new User({                 //create user using Mongoose User model
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, (err) => {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                });
            }
        });
    });

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        console.log(req.body);
        User.register({ username: req.body.username }, req.body.password, (err, user) => {
            if (err) {
                console.log("Error registering: ");
                console.log(err);
                res.redirect("/register");
            } else {
                console.log("Registration Successful");
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                });
            }
        });
    });




app.route("/secrets")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            console.log("Local Authentication Successful");
            res.render("secrets");
        } else {
            console.log("Local Authentication Failed");
            res.redirect("/login");
        }
    });

app.route("/logout")
    .get((req, res) => {
        req.logout((err) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        });

    });

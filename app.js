//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const PORT = process.env.PORT;
const app = express();



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://"+process.env.DB_USER+":"+process.env.DB_PASS+"@fruits.ejwew7h.mongodb.net/userDB", {useNewUrlParser: true});


const userSchema = mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/secrets", (req, res) =>{
    User.find({"secret":{$ne: null}}, (err, result)=>{
        if(!err){
            res.render("secrets", {usersWithSecrets: result});
        }
    });
});

app.post("/register", (req, res)=>{
    User.register({username: req.body.username},req.body.password , (err, user)=>{
        if(!err){
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets")
            });
        }else{
            res.redirect("/register")
        };
    });
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.post("/login", (req,res )=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user,(err)=>{
        if(!err){
            res.redirect("/secrets")
        }else{
            console.log(err)
        } ;
    });
});

app.get("/logout", (req, res)=>{
    req.logout(()=>{});
    res.redirect("/");
});

app.get("/submit", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/")
    }
});

app.post("/submit",(req, res)=>{
    const submittedSecret = req.body.secret;

    User.findById(req.user._id, (err, result)=>{
        if(!err){
            result.secret = submittedSecret;
            result.save(()=>{
                res.redirect("/secrets");
            })
        }
    });
});

app.listen(PORT, ()=>{
    console.log("Listening");
})
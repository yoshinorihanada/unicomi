//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");



const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs"); 
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost/auth_demo");
app.use(require("express-session")({
secret:"Any normal Word",//decode or encode session
    resave: false,          
    saveUninitialized:false    
}));


//setting up the get routes
app.get("/",function(req,res){
    // res.sendFile(__dirname + "/signin.html");
    res.render("home");
  
});

app.get("/signin", function(req,res){
    res.render("signin");
});

app.get("/signup", function(req,res){
    res.render("signup");
});


app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");
});

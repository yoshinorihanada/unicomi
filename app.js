//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const fs = require('fs');
var path = require('path');


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/unicomi-user", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String,
    profileimg:
    {
        data: Buffer,
        contentType: String
    },
    grade: String,
    area: String,
    university: String,
    bio: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//set up multer for storing uploaded files
// var multer = require('multer');

// var storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, '/uploads')
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.fieldname + '-' + Date.now())
//     }
// });

// var upload = multer({ storage: storage });

//setting up the get routes
app.get("/", function (req, res) {

    res.render("home");

});

app.get("/signin", function (req, res) {
    res.render("signin");
});

app.get("/signup", function (req, res) {
    res.render("signup");
});

app.get("/my-profile", function (req, res) {

    if (req.isAuthenticated()) {
        res.render("my-profile");
    } else {
        res.redirect("/");
    }
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get("/unicomi", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("unicomi");
    } else {
        res.redirect("/signin");
    }
})

app.get("/createacc", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("createacc");
    } else {
        res.redirect("/");
    }
})

app.get("/filtering", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("filtering");
    } else {
        res.redirect("/");
    }
})

app.get("/edit-profile", function (req, res) {
    if (req.isAuthenticated()) {
        User.findById(req.user.id, function (err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    
                    res.render("edit-profile", {name: foundUser.name, grade: foundUser.grade, university: foundUser.university, bio: foundUser.bio, area: foundUser.area});
                }
            }
        });
        
    } else {
        res.redirect("/");
    }
});

app.get("/user_profile", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("user_profile");
    } else {
        res.redirect("/");
    }
});


app.post("/signin", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //passport method
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/unicomi");
            });
        }
    });

});


app.post("/signup", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/signup");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/createacc");
            });
        }
    });
});

app.post("/createacc", function (req, res) {

    // upload.single('avator')(req, res, function (error) {
    //     if (error) {
    //         console.log(`upload.single error: ${error}`);
    //         return res.sendStatus(500);
    //     }
    //     // code

    // })

    const name = req.body.name;
    // const profileimg = {
    //     data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
    //     contentType: 'image/png'
    // }

    const grade = req.body.grade;
    const university = req.body.university;
    const bio = req.body.bio;
    const area = req.body.area;

    const filter = {_id: req.user.id};
    const update = {name: name, grade: grade, university: university, bio: bio , area: area};

    console.log(req.body)

    // User.findById(req.user.id, function (err, foundUser) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         if (foundUser) {
    //             foundUser.name = name;
    //             // foundUser.profileimg = profileimg;
    //             foundUser.grade = grade;
    //             foundUser.university = university;
    //             foundUser.bio = bio;
    //             foundUser.area = area;
    //             foundUser.save(function () {
    //                 res.redirect("/unicomi");
    //             });
    //         }
    //     }
    // });

    User.updateOne(filter, {$set: update}, function (err){
        if(err){
            console.log(err);
        }else{
            console.log("successfully updated the users profile.");
            
            res.redirect("/unicomi");
        }
    });


});

app.post("/edit-profile", function(req,res){
    console.log(req.body)
    const name = req.body.name;
    const grade = req.body.grade;
    const university = req.body.university;
    const bio = req.body.bio;
    const area = req.body.area;

    const filter = {_id: req.user.id};
    const update = {name: name, grade: grade, university: university, bio: bio, area: area};

    User.updateOne(filter, update, function (err){
        if(err){
            console.log(err);
        }else{
            console.log("successfully updated the users profile.");
            console.log(update);
            res.redirect("/my-profile");
        }
    });

    
});




app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port 3000");
});
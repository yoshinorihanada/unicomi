//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const methodOverride = require('method-override');

const random = require('mongoose-simple-random');


const fs = require('fs');
var path = require('path');


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

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
userSchema.plugin(random);

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {

    res.render("home");

});

app.route("/signin")
    .get(function (req, res) {
        res.render("signin");
    })
    .post(function (req, res) {
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

app.route("/signup")
    .get(function (req, res) {
        res.render("signup");
    })
    .post(function (req, res) {

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


app.get("/my-profile", function (req, res) {

    if (req.isAuthenticated()) {
        User.findById(req.user.id, function (err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    res.render("my-profile", { MyArea: foundUser.area, MyName: foundUser.name, MyGrade: foundUser.grade, MyUniversity: foundUser.university, MyBio: foundUser.bio });

                }
            }
        });

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
        User.findRandom({}, {},{limit:9},function (err,foundUsers){
            if(err){
                console.log(err)
            } else {
                if(foundUsers)
                res.render("unicomi", { users : foundUsers});
            }
            console.log(foundUsers)
        })
    } else {
        res.redirect("/signin");
    }
});

app.route("/createacc")
    .get(function (req, res) {
        if (req.isAuthenticated()) {
            res.render("createacc");
        } else {
            res.redirect("/");
        }
    })
    .patch(function (req, res) {

        const filter = { _id: req.user.id };

        console.log(req.body)

        User.updateOne(filter, { $set: req.body }, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("successfully created the users profile.");

                res.redirect("/unicomi");
            }
        });


    });

app.get("/filtering", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("filtering");
    } else {
        res.redirect("/");
    }
})

app.route("/edit-profile")
    .get(function (req, res) {
        if (req.isAuthenticated()) {
            User.findById(req.user.id, function (err, foundUser) {
                if (err) {
                    console.log(err);
                } else {
                    if (foundUser) {

                        res.render("edit-profile", { name: foundUser.name, grade: foundUser.grade, university: foundUser.university, bio: foundUser.bio, area: foundUser.area });
                    }
                }
            });

        } else {
            res.redirect("/");
        }
    })
    .patch(function (req, res) {
        console.log(req.body);

        const filter = { _id: req.user.id };

        User.updateOne(filter, { $set: req.body }, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("successfully updated the users profile.");

                res.redirect("/my-profile");
            }
        });


    });

app.get("/user-profile/:userId", function (req, res) {

    const requestedUserId = req.params.userId;
    if (req.isAuthenticated()) {
        User.findOne({_id: requestedUserId},function(err,foundUser){
            if(err){
                console.log(err);
            }else {
                res.render("user-profile", {MyName: foundUser.name, MyUniversity: foundUser.university, MyArea: foundUser.area, MyGrade:foundUser.grade, MyBio: foundUser.bio});
            }
            
        });
        
    } else {
        res.redirect("/");
    }
});








// app.post("/edit-profile", function(req,res){
//     console.log(req.body)
//     const name = req.body.name;
//     const grade = req.body.grade;
//     const university = req.body.university;
//     const bio = req.body.bio;
//     const area = req.body.area;

//     const filter = {_id: req.user.id};
//     const update = {name: name, grade: grade, university: university, bio: bio, area: area};

//     User.updateOne(filter, {$set: update}, function (err){
//         if(err){
//             console.log(err);
//         }else{
//             console.log("successfully updated the users profile.");
//             console.log(update);
//             res.redirect("/my-profile");
//         }
//     });


// });





app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port 3000");
});
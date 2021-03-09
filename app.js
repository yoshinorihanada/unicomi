//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
//for deploying patch request
const methodOverride = require('method-override');
//for using query in get request
const querystring = require('querystring');       
//for uploading image
const multer = require('multer');
const helpers = require('./helpers');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/files');
    },

    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

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

// mongoose.connect("mongodb://localhost:27017/unicomi-user", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect("mongodb+srv://admin-yoshinori:test1234@cluster0.yv5io.mongodb.net/unicomi-user", { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log("MongoDB Connected…")
  }).catch(err => console.log(err));

mongoose.set("useCreateIndex", true);

const User = require("./model/userSchema")

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




app.get("/logout", function (req, res) {
    req.logout();
    res.redirect('/');
});
app.route('/unicomi')
    .get( function (req, res) {
        
        if (req.isAuthenticated()) {
            User.findRandom(req.query, {},{limit:8},function (err,foundUsers){
                if(err){
                    console.log(err)
                } else {
                    if(foundUsers){
                        res.render("unicomi", { users : foundUsers, query: "?" + querystring.stringify(req.query)});
                    } else{
                        res.redirect("/no-profile-found");
                    }
                    
                }
                // console.log(foundUsers)
            })
        } else {
            res.redirect("/signin");
        }
    });

app.get("/no-profile-found", function(req,res){
    if (req.isAuthenticated()) {
        res.render("no-profile");
    } else {
        res.redirect("/");
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
    .post(function (req, res) {
        // let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('profile_pic');

        const filter = { _id: req.user.id };

        console.log(req.body)

        User.updateOne(filter, { $set: {name: req.body.name, bio: req.body.bio, university: req.body.university, area: req.body.area, grade: req.body.grade, profileimg: "user_icon.png"} }, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("successfully created the users profile.");

                res.redirect("/unicomi");
            }
        });


    });

app.route("/filtering")
    .get(function (req, res) {
        if (req.isAuthenticated()) {
            res.render("filtering");
        } else {
            res.redirect("/");
        }
    })
    .post(function(req,res){
        const filter = {university: req.body.university, area: req.body.area, grade: req.body.grade}
        
        if(filter.university === '') delete filter.university;

        if(filter.area === 'none') delete filter.area;

        if(filter.grade === 'none') delete filter.grade;

        const query = querystring.stringify(filter);
        res.redirect('/unicomi?' + query);
        
    });
    
app.route("/edit-profile-pic")
    .get(function(req,res){
        if (req.isAuthenticated()) {
            res.render("edit-profile-pic");
        } else {
            res.redirect("/");
        }
    })
    .patch(function(req,res){
        let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('profile_pic');

        upload(req, res, function(err) {
            // req.file contains information of uploaded file
            // req.body contains information of text fields, if there were any
    
            if (req.fileValidationError) {
                return res.send(req.fileValidationError);
            }
            else if (!req.file) {
                return res.send('Please select an image to upload');
            }
            else if (err instanceof multer.MulterError) {
                return res.send(err);
            }
            else if (err) {
                return res.send(err);
            }
            
            console.log(req.file)
            const filter = { _id: req.user.id };

            User.updateOne(filter, { $set: {profileimg: req.file.filename}}, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("successfully updated the users profile picture.");

                    res.redirect("/my-profile");
                }
            });
            
        });
    });

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
                console.log(foundUser.profileimg);
                res.render("user-profile", {MyName: foundUser.name, MyUniversity: foundUser.university, MyArea: foundUser.area, MyGrade:foundUser.grade, MyBio: foundUser.bio, MyImage: foundUser.profileimg});
            }
            
        });
        
    } else {
        res.redirect("/");
    }
});

app.get("/my-profile", function (req, res) {

    if (req.isAuthenticated()) {
        User.findById(req.user.id, function (err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    
                    res.render("my-profile", { MyArea: foundUser.area, MyName: foundUser.name, MyGrade: foundUser.grade, MyUniversity: foundUser.university, MyBio: foundUser.bio, MyImage: foundUser.profileimg });

                }
            }
        });

    } else {
        res.redirect("/");
    }
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port 3000");
});
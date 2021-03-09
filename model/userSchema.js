const mongoose = require("mongoose");
const random = require('mongoose-simple-random');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String,
    profileimg: String,
    grade: String,
    area: String,
    university: String,
    bio: String
});

userSchema.plugin(random);

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

module.exports = User;
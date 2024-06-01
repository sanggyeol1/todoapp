const mongoose = require("mongoose")
const Schema = mongoose.Schema
const jwt = require('jsonwebtoken')
require('dotenv').config()
const JWT_SEC_KEY = process.env.JWT_SECRET_KEY
const userSchema = Schema({
    email: { type: String, required: true, unique: true },
    password:{ type : String, required: true },
    name:{ type : String, required: true },
    level:{ type : String, default : "customer" } //customer type과 admin type
},{timestamps: true})

userSchema.methods.toJson = function(){
    const obj = this._doc
    delete obj.password
    delete obj.__v
    delete obj.createAt
    return obj
}

userSchema.methods.generateToken = async function(){
    const token = await jwt.sign({_id:this._id}, JWT_SEC_KEY,{expiresIn:'1d'} )
    return token
}

const User = mongoose.model("User", userSchema);
module.exports = User;

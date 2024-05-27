const mongoose = require("mongoose")
const Schema = mongoose.Schema
const jwt = require('jsonwebtoken')
require('dotenv').config()
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

const userSchema = Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true }
) //시간이 알아서 찍힘

//백 -> 프론트로 데이터를 보낼 때 항상 pw제거
userSchema.methods.toJSON = function(){
    const obj = this._doc 
    delete obj.password
    delete obj.updatedAt;
    delete obj.__v;
    return obj
}
//토큰 생성
userSchema.methods.generateToken = function () {
    const token = jwt.sign({ _id: this._id }, JWT_SECRET_KEY, { expiresIn: '1d' })//유저의 _id를이용해 토큰이용, expire은 하루뒤
    return token
}
const User = mongoose.model("User", userSchema)
module.exports = User;
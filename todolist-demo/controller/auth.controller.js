const authController = {}
const jwt = require("jsonwebtoken")
require("dotenv").config()//.env 읽어오는 방식
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

//token이 valid한지 해석만 해주는 함수
authController.authenticate = (req, res, next) => {
    try {
        const tokenString = req.headers.authorization //Bearer dflksjdfa
        if (!tokenString) {
            throw new Error("invalid token")
        }
        const token = tokenString.replace("Bearer ", "")
        jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
            if (error) {
                throw new Error("invalid token")
            }
            // res.status(200).json({status : "success", userId : payload._id})
            req.userId = payload._id
            next()
        })


    } catch (err) {
        res.status(400).json({ status: "fail", message: err.message })
    }
}


module.exports = authController;
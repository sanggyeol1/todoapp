const jwt = require("jsonwebtoken")
const User = require('../models/User')
const bcrypt = require('bcryptjs')
require("dotenv").config()
const { OAuth2Client } = require('google-auth-library');
const JWT_SEC_KEY = process.env.JWT_SECRET_KEY
const GOOGLE_CLI_ID = process.env.GOOGLE_CLIENT_ID
const authController = {}

authController.loginWithEmail = async (req, res) => {
    try {
        const { email, password } = req.body
        let user = await User.findOne({ email })
        if (user) {
            const isMath = await bcrypt.compare(password, user.password)
            if (isMath) {
                //token
                const token = await user.generateToken()
                return res.status(200).json({ statsus: 'success', user, token })
            }
        }
        throw new Error("invaild email or password")
    } catch (err) {
        res.status(400).json({ status: 'fail', error: err.message })
    }
}

authController.loginWithGoogle = async (req, res) => {
    try {//google auth library 사용
        const { token } = req.body
        const googleCilent = new OAuth2Client(GOOGLE_CLI_ID)
        const ticket = await googleCilent.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLI_ID,
        })
        const { email, name } = ticket.getPayload()

        let user = await User.findOne({ email: email })
        if (!user) {
            //유저새로생성
            const randomPassword = "" + Math.floor(Math.random() * 100000000)
            const salt = await bcrypt.genSalt(10)
            const newPassword = await bcrypt.hash(randomPassword, salt)
            user = new User({
                name,
                email,
                password: newPassword
            })
            await user.save()
        }
        //토큰만 발행
        const sessionToken = await user.generateToken()
        res.status(200).json({ status: "success", user, token: sessionToken })

    } catch (err) {
        res.status(400).json({ status: 'fail', error: err.message })
    }
}


authController.authenticate = async (req, res, next) => {
    try {
        const tokenString = req.headers.authorization
        if (!tokenString) throw new Error("token not found")
        const token = tokenString.replace("Bearer ", "")//순수토큰만 걸러내기
        jwt.verify(token, JWT_SEC_KEY, (error, payload) => {
            if (error) throw new Error("invaild token")
            req.userId = payload._id
        })
        next();
    } catch (err) {
        res.status(400).json({ status: "fail", error: err.message })
    }
}


authController.checkAdminPermission = async (req, res, next) => {
    try {
        const { userId } = req
        const user = await User.findById(userId)
        if (user.level !== 'admin') throw new Error("no permission")
        next()
    } catch (err) {
        res.status(400).json({ status: "fail", error: err.message })
    }
}


module.exports = authController
const User = require('../models/User')
const bcrypt = require('bcryptjs')

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
        res.status(400).json({status:'fail', error:err.message})
    }
}


module.exports = authController
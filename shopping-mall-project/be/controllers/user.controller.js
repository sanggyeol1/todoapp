const User = require("../models/User")
const bcrypt = require("bcryptjs")

const userController = {}

userController.createUser = async (req, res) => {
    try {
        let { email, password, name, level } = req.body
        const user = await User.findOne({ email })
        if (user) {
            throw new Error('User already exist')
        }
        const salt = await bcrypt.genSalt(10)
        password = await bcrypt.hash(password, salt)
        const newUser = new User({ email, password, name, level: level ? level : 'customer' })
        await newUser.save()
        return res.status(200).json({ status: "success" })
    } catch (err) {
        res.status(400).json({ status: "fail", err: err.message })
    }

}


userController.getUser= async(req, res)=>{
    try{
        const user = await User.findById(req.userId);
        if(user){
            return res.status(200).json({status:"success", user})
        }
        throw new Error("invaild token")
    }catch(err){
        res.status(400).json({status : "error", error: err.message})
    }
}



module.exports = userController
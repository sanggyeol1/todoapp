const User = require("../model/User")
const bcrypt = require("bcryptjs")
const saltRounds = 10

const userController = {}

//회원가입
userController.createUser = async (req, res) => {
    try {
        const { email, name, password } = req.body

        const user = await User.findOne({ email })
        if (user) {
            throw new Error("이미 가입된 유저입니다.")
        }

        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);
        const newUser = new User({ email, name, password: hash })
        await newUser.save()


        res.status(200).json({ status: "success" })
    } catch (err) {
        res.status(401).json({ status: "fail", error: err })
    }
}

//로그인
userController.loginWithEmail = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email },"-createdAt -updatedAt -__v")//필요한 정보만 프로젝션
        if (user){
            const isMath = bcrypt.compareSync(password, user.password) // bcrypt비교함수로 암호화된pw와 req.body.pw비교
            if(isMath){//이메일 pw가 match하면 토큰 발행
                const token = user.generateToken()
                return res.status(200).json({status:"success", user, token})
            }
        }
        throw new Error("아이디 또는 비밀번호가 일치하지 않습니다.")
    } catch (err) {
        res.status(400).json({status:"fail",  message : err.message})
    }
}

userController.getUser = async(req, res) =>{
    try{
        const userId = req.userId
        const user = await User.findById(userId)
        if(!user){
            throw new Error("cannot find user")
        }
        res.status(200).json({status:"success",  user})
    }catch(err){
        res.status(400).json({status:"fail",  message : err.message})
    }
}


module.exports = userController
//미들웨어 : 중간에서 작업을 해서 넘김

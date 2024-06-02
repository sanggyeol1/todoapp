const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");


//회원가입
router.post('/', userController.createUser);
//토큰값은 body가 아닌 header에 넣어 보내기때문에 get을 사용
router.get('/me', authController.authenticate, userController.getUser)//토큰이 valid한지 확인, 

module.exports = router;
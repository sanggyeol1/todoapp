const express = require('express')
const router = express.Router();
const userController = require("../controller/user.controller")

//1. 회원가입 endpoint
router.post("/", userController.createUser)
//로그인
router.post("/login", userController.loginWithEmail)

module.exports = router;
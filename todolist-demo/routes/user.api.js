const express = require('express')
const router = express.Router();

//1. 회원가입 endpoint
router.post("/", (req, res)=>{
    res.send("create user controller will be here")
})

module.exports = router;
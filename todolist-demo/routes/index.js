const express = require('express')
const router = express.Router()
const taskApi = require('./task.api')
const userApi = require('./user.api')

router.use('/tasks', taskApi) //tasks호출이 오면 taskApi로 넘김
router.use('/user', userApi) 
module.exports = router
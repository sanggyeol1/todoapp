const express = require('express')
const router = express.Router()
const taskApi = require('./task.api')

router.use('/tasks', taskApi) //tasks호출이 오면 taskApi로 넘김

module.exports = router
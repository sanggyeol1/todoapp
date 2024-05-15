//task관련 api들
const express = require('express');
const taskController = require('../controller/task.controller');
const router = express.Router()

//라우터 정의
router.post('/', taskController.createTask)

router.get('/', taskController.getTask)

router.put('/:id', (req, res)=>{
    res.send('update task')
})

router.delete('/:id', (req,res)=>{
    res.send('delete task')
});

module.exports = router;

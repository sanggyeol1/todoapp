const mongoose = require('mongoose')
const Schema = mongoose.Schema

const taskSchema = Schema({
    task : {
        type : String,
        required : true,
    },
    isComplete : {
        type : Boolean,
        require : true,
    },
},{timestamps : true})//시간이 알아서 찍힘

const Task = mongoose.model("Task", taskSchema) //taskSchema를 참고하여 task라는 모델을 만든다.

module.exports = Task
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const taskSchema = Schema({
    task : {
        type : String,
        required : true,
    },
    isComplete : {
        type : Boolean,
        required : true,
    },
    author : {
        type : Schema.Types.ObjectId,
        required : true,
        ref : "User" //fk
    }
},{timestamps : true})//시간이 알아서 찍힘

taskSchema.methods.toJSON = function(){//프로젝션
    const obj = this._doc 
    delete obj.updatedAt;
    delete obj.__v;
    return obj
}


const Task = mongoose.model("Task", taskSchema) //taskSchema를 참고하여 task라는 모델을 만든다.

module.exports = Task
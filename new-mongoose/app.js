const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/mongoose-test');//연결
const validator = require('validator');
const { Schema } = mongoose;

const userSchema = new Schema({ //스키마 생성
    name : {
        type : String,
    },
    email : {
        type : String,
        required : true, //not null
        validate : {
            validator : function(value){ //이메일 형식 지정
                if(!validator.isEmail(value)){
                    throw new Error("this is not an Email")
                }
            },
        },
    },
    password:{
        type : String,
        required : true,
        trim : true, //공백 삭제
    },
    age : {
        type : Number,
        default : 0,
    }
})

const User = mongoose.model("User", userSchema)

// const newUser = new User({ // 객체 생성
//     name : 'sanggyeol',
//     email : 'sanggyoel1@naver.com',
//     password : "        abcdee",
// })

// newUser.save().then(value=>console.log("value is", value)) // insert후 출력


User.find({name : 'sanggyeol'})
.select('name -_id')
.then((value)=>console.log(value))

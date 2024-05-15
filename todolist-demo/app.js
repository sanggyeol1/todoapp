const express = require('express') //express를 받아옴
const mongoose = require('mongoose')
const bodyParser = require("body-parser")
const indexRouter = require("./routes/index") //router의 연결고리
const app = express() //express를 사용한 app
app.use(bodyParser.json())//req.body읽어오기 위함
app.use('/api', indexRouter) // api로 호출이 오면 indexRouter로 감

const mongoURI = `mongodb://localhost:27017/todolist-demo`

mongoose
    .connect(mongoURI, { useNewUrlParser: true })
    .then(() => {
        console.log("mongoose connected")
    }).catch((err) => {
        console.log("DB connection failed")
    })

app.listen(5000, () => {
    console.log("server in 5000")
})
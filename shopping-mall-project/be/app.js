const express = require('express')
const moongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const session = require('express-session');
const indexRouter = require("./routes/index")
const { default: mongoose } = require('mongoose')
const app = express()

require('dotenv').config()


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())//req.body 객체로 인식
app.use(cors())
app.use("/api", indexRouter)

const mongoURI = process.env.MONGODB_URI_PROD
mongoose.connect(mongoURI, { useNewUrlParser: true })
    .then(() => console.log("mongoose connected"))
    .catch((err) => console.log("DB connected fail", err))


app.listen(process.env.PORT || 5000, () => {
    console.log("server on 5000")
})
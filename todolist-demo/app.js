const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require("body-parser");
const indexRouter = require("./routes/index"); //router의 연결고리
require('dotenv').config()
const app = express(); //express를 사용한 app
const MONGODB_URI_PROD = process.env.MONGODB_URI_PROD

// CORS 설정
const corsOptions = {
  origin: 'https://master--taupe-brigadeiros-3227eb.netlify.app', // 클라이언트의 도메인
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json()); //req.body읽어오기 위함
app.use('/api', indexRouter); // api로 호출이 오면 indexRouter로 감

const mongoURI = MONGODB_URI_PROD

mongoose
    .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("mongoose connected");
    }).catch((err) => {
        console.log("DB connection failed");
    });

// Preflight 요청에 대한 응답 추가
app.options('/api/tasks', cors(corsOptions));

app.listen(process.env.PORT || 5000, () => {
    console.log("server in 5000");
});

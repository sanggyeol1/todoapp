const express = require('express') //express를 받아옴
const app = express() //express를 사용한 app

const checkAuth = (req, res, next) => {
    console.log('she has admin permission')
    next()//다음
}

const getUser = (req, res) => {
    res.send("here is user information")
}

const token = true

const checkToken = (req, res, next) => {
    if ( token ){
        next()
        console.log("you have a token")
    }else{
        res.send('you don\'t have token')
    }
}

app.get("/users", checkAuth, checkToken, getUser)//getuser 실행전 checkUser

app.get("/", (req, res) => {
    res.send("hello? world")
})

app.get("/about", (req, res) => {
    res.send("about world")
})


app.listen(5000, () => {
    console.log('server is on 5000')
})
const { MongoClient } = require("mongodb"); //몽고클라이언트 가져옴
const uri = `mongodb://localhost:27017/` //compass에 있는 local주소
const client = new MongoClient(uri) //연결

async function run(){
    const database = client.db('firstDB') //데이터베이스 이름, 생성
    const users = database.collection('users') //user collection생성
    
    // 단일삽입
    // const userData = await users.insertOne({ name : 'noona',age : 17 }) 
    // console.log('result', userData)

    //여러개삽입
    // const userList = [{name : '철수', age : 30}, {name : '제시카', age : 25}] 
    // const userListResult = await users.insertMany(userList)
    // console.log(userListResult)

    //하나만찾기(첫번째 데이터만 리턴)
    // const findUser = await users.findOne({name : '철수'})
    // console.log(findUser)

    //다찾기(array로 받아야함)
    // const findUserAll = await users.find({}).toArray();
    // console.log(findUserAll)

    //특정 조건으로 찾기 ex)gt, lt, in 등
    // const findUsergt = await users.find({ age : { $gt : 20 } }).toArray();
    // console.log(findUsergt)
}

run()
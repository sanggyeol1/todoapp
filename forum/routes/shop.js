const router = require('express').Router() //라우터파일 분류

//db에 연동하는 코드
//여기서도db변수를 사용 가능하다.

let connectDB = require('./../database.js')
let db;
connectDB.then((client)=>{//디비와 연동
    console.log('DB연결성공')
    db = client.db('forum');
}).catch((err)=>{
    console.log(err)
})


router.get('/shirt', async(요청, 응답)=>{
    await db.collection('post').find().toArray()//db사용 가능
    응답.send('셔츠파는곳')
})

router.get('/pants', (요청,응답)=>{
    응답.send('바지파는곳')
})

module.exports = router 
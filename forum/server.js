const express = require('express')//express 라이브러리 사용하겠다.
const app = express()
const { MongoClient, ObjectId } = require('mongodb');//mongodb 연결, ObjectId 사용
const methodOverride = require('method-override')//메소드 오버라이딩
const bcrypt = require('bcrypt')//bcrypt세팅
require('dotenv').config()//환경변수 다른 파일에 저장

app.use(methodOverride('_method'))//form태그에서 put요청, delete요청 가능
app.use(express.static(__dirname + '/public'))//퍼블릭 폴더 안의 static 파일 사용
app.set('view engine', 'ejs')//ejs사용 문법
app.use(express.json())
app.use(express.urlencoded({extended:true}))//요청.body사용가능

//passport 라이브러리 세팅
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const MongoStore = require('connect-mongo')//세션을 db에 저장 -> npm install connect-mongo

app.use(passport.initialize())
app.use(session({
  secret: '암호화에 쓸 비번',
  resave : false, // 요청날릴때마다 세션 갱신할건지
  saveUninitialized : false, // 로그인안해도 세션 만들건지
  cookie : { maxAge : 60*60*1000 },//세션데이터 유효기간 1시간
  store : MongoStore.create({
    mongoUrl : 'mongodb+srv://sanggyeol1:qwe123@cluster0.4pltbdt.mongodb.net/?retryWrites=true&w=majority',
    dbName : 'forum'//forum 데이터베이스에 session이라는 collection생성됨
  })
}))
app.use(passport.session())
app.use('/write',checkLogin)
app.use('/mypage',checkLogin)//이 함수 밑에 있는 모든 API에 로그인 체크 미들웨어 적용

//이미지 업로드 라이브러리
const { S3Client } = require('@aws-sdk/client-s3')
const multer = require('multer')
const multerS3 = require('multer-s3');
const connectDB = require('./database.js');
const s3 = new S3Client({
  region : 'ap-northeast-2',//서울
  credentials : {
      accessKeyId : process.env.S3_KEY,// 키
      secretAccessKey : process.env.S3_SECRET //비밀 키
  }
})

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'sanggyeolbucket',//버킷명
    key: function (요청, file, cb) {
      cb(null, Date.now().toString()) //업로드시 파일명 변경가능
    }
  })
})


//로그인 체크기능
function checkLogin(요청, 응답, next){
    if(!요청.user){
        응답.render('login.ejs')
    }else{
        next()
    }
}
//빈칸체크기능
function checkBlank(요청, 응답, next){
    if(요청.body.username=='' || 요청.body.password==''){
        응답.send('아이디 또는 비밀번호가 입력되지 않았습니다.')
    }else{
        next()
    }
}

//db에 연동하는 코드

let db;
connectDB.then((client)=>{//디비와 연동
    console.log('DB연결성공')
    db = client.db('forum');
    const server = app.listen(process.env.PORT, ()=>{//서버열기
        console.log('http://localhost:8080 에서 서버 실행중')
    })
}).catch((err)=>{
    console.log(err)
})

//get요청오면 파일띄워줌
app.get('/', (요청, 응답)=>{
    응답.sendFile(__dirname + '/index.html') // 현재프로젝트 절대경로 + html 파일상대경로
})



app.get('/list', async(요청, 응답)=>{
    let result = await db.collection('post').find().toArray()//collection에 있는 데이터 뽑음
    응답.render('list.ejs', {글목록 : result})//ejs파일은 render
})


app.get('/write', async(요청, 응답)=>{
        응답.render('write.ejs')    
})


//글 작성기능, 예외처리 : 제목공백, 내용공백, 제목너무김, 제목에 특수기호포함 등
app.post('/add', upload.single('img1'),async(요청, 응답)=>{

    console.log(요청.file.location)//이미지 태그 안에 location url넣으면 html상에 이미지 띄워줄 수 있음

    try{//코드먼저실행해보고
        if(요청.body.title=='' || 요청.body.content ==''){
            응답.send('제목또는 내용을 입력하시오')
        }else if(요청.body.title.length > 50) {
            응답.send('제목을 50자 이내로 작성하시오.');
        }else{
            await db.collection('post').insertOne({ 
                title : 요청.body.title, 
                content : 요청.body.content, 
                writer : 요청.user.username,
                img : 요청.file.location
            })
            응답.redirect('/list');//서버기능 끝나면 항상 응답
        }
    }catch(e){//에러가난다면 여기 실행
        console.log(e)//에러메세지 출력
        응답.status(500).send('서버 에러남')//500은 서버상 오류, 프론트에 전달
    }
})

//상세페이지기능 : URL파라미터
app.get('/detail/:id', async(요청, 응답)=>{//detail뒤에 아무 문자나 입력해도 안쪽 코드 실행 /detail/:id/:id2/:id3 이런식으로 여러개 써도 됨
    try{//예외처리
        let result = await db.collection('post').findOne({ _id : new ObjectId(요청.params.id) })// /detail/url이 _id와 동일한 값 찾아옴
        응답.render('detail.ejs' ,{ result : result })
        if(result ==  null){
            응답.status(404).send('유효하지 않은 url주소입니다 (404 NotFound).')//예외처리 : 404은 NotFound(주소길이는 같은데 주소가 다름)
        }
    }catch(e){
        console.log(e)
        응답.status(404).send('유효하지 않은 url주소입니다 (404 NotFound).')//예외처리 : 404은 NotFound(주소길이가 다름)
    }
    
})

//수정페이지기능
app.get('/edit/:id',checkLogin, async(요청, 응답)=>{
    let result = await db.collection('post').findOne({ _id : new ObjectId(요청.params.id) })

    if(result.writer != 요청.user.username){
        응답.send('권한 없음')
    }else{
        응답.render('edit.ejs', { result : result })
    }
})
//글수정기능
app.put('/edit', async(요청, 응답)=>{//npm install method-override : 폼태그에서 put, delete가능

    
    try{
        await db.collection('post').updateOne(
            { _id : new ObjectId(요청.body._id) },//찾아와서
            {$set : { title : 요청.body.title, content : 요청.body.content }} //바꿈
          )
          응답.redirect('/list')//수정 후에는 redirection
    }catch(e){
        응답.status(500).send('An error occurred');
        console.log(e)
    }
})

// 좋아요기능
//$inc ->  누를때마다 +1
// app.put('/edit', async(요청, 응답)=>{
//     await db.collection('post').updateOne({ _id : '아이디' }, {$inc : {like : 1}})
// })

//추가정보
//$mul -> *
//updateMany -> 하나만 수정이 아닌 특정 조건을 만족하는 모든 투플 삭제
//like필드가 10 초과인것
//await db.collection('post').updateMany({ like : {$gt : 10} }, {$inc : {like : 1}})
//$gte -> 이상
//$lt -> 미만
//$lte -> 이하
//$ne -> !=


//글삭제기능
app.delete('/delete', async(요청, 응답)=>{
    
    let result = await db.collection('post').findOne({ _id : new ObjectId(요청.query.docid) })
    
    if (!요청.user) {
        응답.status(401).json({ message: 'Unauthorized' }); // 로그인하지 않은 경우
    }else if( 요청.user.username != result.writer ){
        
    }else{
        try{
            await db.collection('post').deleteOne({
                _id : result._id
            })
            응답.status(200).send('삭제완료') //ajax요청 시 새로고침이 안되므로 redirect 안해줌
        }catch(e){
            응답.status(500).send('An error occurred');
        }
    }
        
    
})

// 페이지분할기능(데이터 적을때 버튼만들어 사용)
app.get('/list/:id', async (요청, 응답) => {
    //5개의 글 찾아서 result 변수에 저장하기
    let result = await db.collection('post').find().skip((요청.params.id-1) * 5).limit(5).toArray()//5개까지만 보여줌
    console.log(요청.user)
    응답.render('list.ejs', { 
        글목록 : result,
        user : 요청.user
    })
  })

//다음버튼(빠르지만 1000페이지로 한번에 이동 불가능) 
app.get('/list/next/:id', async (요청, 응답) => {
    //5개의 글 찾아서 result 변수에 저장하기
    let result = await db.collection('post')
    .find({_id : { $gt : new ObjectId(요청.params.id) }})//방금본 마지막 글 다음글 찾음
    .limit(5).toArray() //5개까지만 보여줌

    if(result.length === 0){
        응답.send('더이상 다음 글이 없습니다.')
    }else{
        응답.render('list.ejs', { 글목록 : result })
    }
    
  })

//이전버튼
app.get('/list/prev/:id', async (요청, 응답) => {
    try {
        // 현재 _id보다 작은 문서들을 찾고, 역순으로 정렬하여 최신 5개를 가져옴
        let result = await db.collection('post')
            .find({_id: { $lt: new ObjectId(요청.params.id) }})
            .sort({_id: -1})
            .limit(5)
            .toArray();

        result = result.reverse(); //배열을 뒤집어 원래 순서대로 표시

        if(result.length === 0){
            응답.send('더이상 이전 글이 없습니다.')
        }else{
            응답.render('list.ejs', { 글목록 : result })
        }
    } catch (error) {
        // 오류 처리
        console.error(error);
        응답.status(500).send('서버 오류');
    }
});



//session회원기능
//npm install express-session passport passport-local 

//제출한 id/비번 db와검사하는 로직(라이브러리)
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    let result = await db.collection('user').findOne({ username : 입력한아이디})
    if (!result) {
      return cb(null, false, { message: '존재하지 않는 아이디' })
    }
    //해싱된 비밀번호와 입력한 비밀번호 일치여부
    if (await bcrypt.compare(입력한비번, result.password)) {
      return cb(null, result)
    } else {
      return cb(null, false, { message: '비밀번호가 일치하지 않음' });
    }
  }))
  //로그인시 마다 실행
  passport.serializeUser((user, done) => {
    console.log(user)
    process.nextTick(() => {//내부코드를 비동기적으로 처리해줌
      done(null, { id: user._id, username: user.username })
    })
  })

  //쿠키분석
  //deserializeUser를 특정 route에서만 실행시키는법?
  passport.deserializeUser(async (user, done) => {
    let result = await db.collection('user').findOne({_id : new ObjectId(user.id)})
    delete result.password
    process.nextTick(() => {
      return done(null, result)
    })
})




app.get('/login', async(요청, 응답)=>{
    console.log(요청.user)
    응답.render('login.ejs')
})

app.post('/login',checkBlank, async(요청, 응답, next)=>{
    //id,pw를 db와 비교하는 코드 실행함
    passport.authenticate('local',(error, user, info)=>{ 
        if(error) return 응답.status(500).json(error)
        if(!user) return 응답.status(401).json(info.message)
        요청.logIn(user, (err)=>{
            if(err) return next(err)
            응답.redirect('/')
        })
    })(요청, 응답, next)
})


//마이페이지
app.get('/mypage', async(요청, 응답)=>{
    
        응답.render('mypage.ejs',{user : 요청.user})
})


//회원가입
app.get('/register', (요청, 응답)=>{
    응답.render('register.ejs')
})
//예외처리 : username이나 qw가 빈칸, 중복, 너무짧거나 너무 김
app.post('/register', checkBlank, async(요청, 응답)=>{
    let result = await db.collection('user').findOne({username : 요청.body.username})
    
    try{
        if(!result){
            if(요청.body.password != 요청.body.password2){
                응답.send('회원가입 실패 : 비밀번호 확인 불일치.');
            }else if(요청.body.password.length < 4){
                응답.send('회원가입 실패 : 비밀번호를 4자리 이상 입력.');
            }else{
                //비밀번호 해싱하여 저장 -> npm install bcrypt
                let hash = await bcrypt.hash(요청.body.password, 10)//몇번 꼬을지
                await db.collection('user').insertOne({
                username : 요청.body.username, 
                password : hash//해시한 비밀번호 저장
                })
                응답.redirect('/')
            }
                
        }else{
            응답.send('회원가입 실패 : 아이디 중복.');
        }

    }catch(error){
        console.error(error);
        응답.status(500).send('서버 오류');
    }

})


//로그아웃기능
app.get('/logout', function(요청, 응답){
    요청.logout(function(err) {
      if (err) { return next(err); }
      응답.redirect('/');
    });
  });


//라우터폴더의 파일 사용
app.use('/shop', require('./routes/shop.js') )
app.use('/board/sub', require('./routes/board/sub.js'))

//검색기능
app.post('/search', async (요청, 응답) => {
    try {
        console.log(요청.body.search_words);
        let searchRegex = new RegExp(요청.body.search_words, 'i')//대소문자를 구분하지 않고 검색

        let results = await db.collection('post').find({
            title : { $regex: searchRegex } //정규식
        }).toArray();

        if(results.length > 0) {
            응답.render('search.ejs', { 
                글목록 : results
            });
        } else {
            응답.send("No items found");
        }
    } catch (error) {
        console.error(error);
        응답.status(500).send("Error occurred while processing your request");
    }
});
// 1. 유저가 A를 포함한 게시글 달라고 get요청을 보내면
// 2. 서버에서 A를 포함한 글을 찾아서
// 3. 유저에게 보내줌
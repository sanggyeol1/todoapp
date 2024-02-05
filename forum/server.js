const express = require('express')//express 라이브러리 사용하겠다.
const app = express()
const { MongoClient, ObjectId } = require('mongodb');//mongodb 연결, ObjectId 사용
const methodOverride = require('method-override')//메소드 오버라이딩
const bcrypt = require('bcrypt')//bcrypt세팅
require('dotenv').config()//환경변수 다른 파일에 저장

const { createServer } = require('http')//websoket.io사용
const { Server } = require('socket.io')
const server = createServer(app)
const io = new Server(server) 

app.use(methodOverride('_method'))//form태그에서 putreq, deletereq 가능
app.use(express.static(__dirname + '/public'))//퍼블릭 폴더 안의 static 파일 사용
app.use(express.static(__dirname + '/views'))
app.set('view engine', 'ejs')//ejs사용 문법
app.use(express.json())
app.use(express.urlencoded({extended:true}))//req.body사용가능

//passport 라이브러리 세팅
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const MongoStore = require('connect-mongo')//세션을 db에 저장 -> npm install connect-mongo


const sessionMiddleware = session({
    secret: '암호화에 쓸 비번',
    resave : false, // req날릴때마다 세션 갱신할건지
    saveUninitialized : false, // 로그인안해도 세션 만들건지
    cookie : { maxAge : 60*60*1000 },//세션데이터 유효기간 1시간
    store : MongoStore.create({
      mongoUrl : 'mongodb+srv://sanggyeol1:qwe123@cluster0.4pltbdt.mongodb.net/?retryWrites=true&w=majority',
      dbName : 'forum'//forum 데이터베이스에 session이라는 collection생성됨
    })
  })
app.use(passport.initialize())
app.use(sessionMiddleware)
app.use(passport.session())
io.use((socket, next) => {// Socket.IO와 세션 미들웨어 통합
    sessionMiddleware(socket.request, {}, next);
});

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
    key: function (req, file, cb) {
      cb(null, Date.now().toString()) //업로드시 파일명 변경가능
    }
  })
})


//로그인 체크기능
function checkLogin(req, res, next){
    if (req.user) {
        next(); // User is logged in, proceed to the next middleware/route handler
    } else {
        res.status(401).render('login.ejs',{user : req.user});
    }
}
//빈칸체크기능
function checkBlank(req, res, next){
    if(req.body.username=='' || req.body.password==''){
        res.send('아이디 또는 비밀번호가 입력되지 않았습니다.')
    }else{
        next()
    }
}


//db에 연동하는 코드

let db;
// let changeStream
connectDB.then((client)=>{//디비와 연동
    console.log('DB연결성공')
    db = client.db('forum');

    // let condition = [//insert때만
    //     { $match : { operationType : 'insert' } }
    // ]
    // changeStream = db.collection('post').watch(condition)

    server.listen(process.env.PORT, ()=>{//서버열기
        console.log('http://localhost:8080 에서 서버 실행중')
    })
}).catch((err)=>{
    console.log(err)
})

//getreq오면 파일띄워줌
app.get('/', (req, res)=>{

    res.sendFile(__dirname + '/index.html')
     // 현재프로젝트 절대경로 + html 파일상대경로
})



app.get('/list', async(req, res)=>{
    let result = await db.collection('post').find().toArray()//collection에 있는 데이터 뽑음
    res.render('list.ejs', {글목록 : result})//ejs파일은 render
})


app.get('/write', async(req, res)=>{
        res.render('write.ejs',{user : req.user})    
})


//글 작성기능, 예외처리 : 제목공백, 내용공백, 제목너무김, 제목에 특수기호포함 등
app.post('/add', upload.single('img1'),async(req, res)=>{

    try{

        let imageLocation = req.file ? req.file.location : '' //이미지 업로드하지 않았을때 공백처리
        console.log(imageLocation)//이미지 태그 안에 location url넣으면 html상에 이미지 띄워줄 수 있음
        if(req.body.title=='' || req.body.content ==''){
            res.send('제목또는 내용을 입력하시오')
        }else if(req.body.title.length > 50) {
            res.send('제목을 50자 이내로 작성하시오.');
        }else{
            await db.collection('post').insertOne({ 
                title : req.body.title, 
                content : req.body.content,
                writer_id : req.user._id,
                writer : req.user.username,
                img : imageLocation,
                date : new Date(),
                like : 0
            })
            res.redirect('/list/1');//서버기능 끝나면 항상 res
        }
    }catch(e){//에러가난다면 여기 실행
        console.log(e)//에러메세지 출력
        res.status(500).send('서버 에러남')//500은 서버상 오류, 프론트에 전달
    }
})

//상세페이지기능 : URL파라미터
app.get('/detail/:id', async(req, res)=>{//detail뒤에 아무 문자나 입력해도 안쪽 코드 실행 /detail/:id/:id2/:id3 이런식으로 여러개 써도 됨
    try{
        let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })// /detail/url이 _id와 동일한 값 찾아옴
        let result2 = await db.collection('reply').find({ parent_id : new ObjectId(req.params.id) }).toArray()

        const ids = result2.map(item => item._id);
        let result3 = await db.collection('re_reply').find({ parent_id: { $in: ids } }).toArray();


        res.render('detail.ejs' ,{ result : result, result2 : result2, result3 : result3, user : req.user})
        if(result ==  null){
            res.status(404).send('유효하지 않은 url주소입니다 (404 NotFound).')//예외처리 : 404은 NotFound(주소길이는 같은데 주소가 다름)
        }
    }catch(e){
        console.log(e)
        res.status(404).send('유효하지 않은 url주소입니다 (404 NotFound).')//예외처리 : 404은 NotFound(주소길이가 다름)
    }
})
//댓글작성기능
app.post('/add_reply',checkLogin, async (req, res) => {
     
    if(req.body.reply_content != ''){
        await db.collection('reply').insertOne({
            parent_id : new ObjectId(req.body.parent_id),
            content : req.body.reply_content,
            writer_id : req.user._id,
            writer_name : req.user.username,
            date : new Date()
        })
        res.redirect('back')//이전페이지로
    }else{
        res.send('공백문자 작성 불가')
    }
    
})
//대댓글 작성기능
app.post('/add_re_reply',checkLogin, async(req, res)=>{
    if(req.body.re_reply_content != ''){
        await db.collection('re_reply').insertOne({
            parent_id : new ObjectId(req.body.parent_id),
            content : req.body.re_reply_content,
            writer_id : req.user._id,
            writer_name : req.user.username,
            date : new Date()
        })
        res.redirect('back')//이전페이지로
    }else{
        res.send('공백문자 작성 불가')
    }
})



//수정페이지기능
app.get('/edit/:id',checkLogin, async(req, res)=>{
    let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })

    if(result.writer != req.user.username){
        res.send('권한 없음')
    }else{
        res.render('edit.ejs', { result : result, user : req.user })
    }
})
//글수정기능
app.put('/edit',checkLogin, async(req, res)=>{//npm install method-override : 폼태그에서 put, delete가능

    try{
        await db.collection('post').updateOne(
            { _id : new ObjectId(req.body._id) },//찾아와서
            {$set : { title : req.body.title, content : req.body.content }} //바꿈
          )
          res.redirect('/list/1')//수정 후에는 redirection
    }catch(e){
        res.status(500).send('An error occurred');
        console.log(e)
    }
})

// 좋아요기능
//$inc ->  누를때마다 +1
app.post('/like', checkLogin, async(req, res)=>{
    try{
        if(!req.user){
        res.render('login.ejs')// 로그인하지 않은 경우
    }else{
            await db.collection('post').updateOne({ _id : new ObjectId(req.query._id) }, {$inc : {like : 1}})
            console.log(req.query._id)
            res.status(200).send('좋아요 완료') //ajaxreq 시 새로고침이 안되므로 redirect 안해줌
        }
    }catch(e){
        res.status(500).send('An error occurred');
    } 

    
})

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
app.delete('/delete', async(req, res)=>{
    
    let result = await db.collection('post').findOne({ _id : new ObjectId(req.query.docid) })
    
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' }); // 로그인하지 않은 경우
    }else if( req.user.username != result.writer ){

    }else{
        try{
            await db.collection('post').deleteOne({
                _id : result._id,
                writer_id : req.user._id
               //추가로 작성자_id와 req.user._id를 비교해주면 좋음
            })
            res.status(200).send('삭제완료') //ajaxreq 시 새로고침이 안되므로 redirect 안해줌
        }catch(e){
            res.status(500).send('An error occurred');
        }
    }
        
    
})

// 페이지분할기능(데이터 적을때 버튼만들어 사용)
app.get('/list/:id', async (req, res) => {
    //5개의 글 찾아서 result 변수에 저장하기
    let result = await db.collection('post').find().skip((req.params.id-1) * 8).limit(8).toArray()//5개까지만 보여줌
    
    res.render('list.ejs', { 
        글목록 : result,
        user : req.user
    })
  })

//다음버튼(빠르지만 1000페이지로 한번에 이동 불가능) 
app.get('/list/next/:id', async (req, res) => {
    //5개의 글 찾아서 result 변수에 저장하기
    let result = await db.collection('post')
    .find({_id : { $gt : new ObjectId(req.params.id) }})//방금본 마지막 글 다음글 찾음
    .limit(8).toArray() //5개까지만 보여줌

    if(result.length === 0){
        res.redirect('back')
    }else{
        res.render('list.ejs', { 글목록 : result, user : req.user })
    }
    
  })

//이전버튼
app.get('/list/prev/:id', async (req, res) => {
    try {
        // 현재 _id보다 작은 문서들을 찾고, 역순으로 정렬하여 최신 5개를 가져옴
        let result = await db.collection('post')
            .find({_id: { $lt: new ObjectId(req.params.id) }})
            .sort({_id: -1})
            .limit(8)
            .toArray();

        result = result.reverse(); //배열을 뒤집어 원래 순서대로 표시

        if(result.length === 0){
            res.redirect('back')
        }else{
            res.render('list.ejs', { 글목록 : result, user : req.user })
        }
    } catch (error) {
        // 오류 처리
        console.error(error);
        res.status(500).send('서버 오류');
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




app.get('/login', async(req, res)=>{
    console.log(req.user)
    res.render('login.ejs',{user : req.user})
})

app.post('/login',checkBlank, async(req, res, next)=>{
    //id,pw를 db와 비교하는 코드 실행함
    passport.authenticate('local',(error, user, info)=>{ 
        if(error) return res.status(500).json(error)
        if(!user) return res.status(401).json(info.message)
        req.logIn(user, (err)=>{
            if(err) return next(err)
            res.redirect('/list/1')
        })
    })(req, res, next)
})


//마이페이지
app.get('/mypage', async(req, res)=>{
        res.render('mypage.ejs',{user : req.user})
})
app.get('/mypageEdit', async(req, res)=>{
    res.render('mypageEdit.ejs',{user : req.user})
})
app.post('/Edit_mypage', async(req, res)=>{

    try{
        await db.collection('user').updateOne(
            { _id : new ObjectId(req.body._id) },//찾아와서
            {$set : { address : req.body.address, introduce : req.body.introduce }} //바꿈
          )
          res.redirect('/mypage')//수정 후에는 redirection
    }catch(e){
        res.status(500).send('An error occurred');
        console.log(e)
    }
})


//회원가입
app.get('/register', (req, res)=>{
    res.render('register.ejs',{user : req.user})
})
//예외처리 : username이나 qw가 빈칸, 중복, 너무짧거나 너무 김
app.post('/register', checkBlank, async(req, res)=>{
    let result = await db.collection('user').findOne({username : req.body.username})
    
    try{
        if(!result){
            if(req.body.password != req.body.password2){
                res.send('회원가입 실패 : 비밀번호 확인 불일치.');
            }else if(req.body.password.length < 4){
                res.send('회원가입 실패 : 비밀번호를 4자리 이상 입력.');
            }else{
                //비밀번호 해싱하여 저장 -> npm install bcrypt
                let hash = await bcrypt.hash(req.body.password, 10)//몇번 꼬을지
                await db.collection('user').insertOne({
                username : req.body.username, 
                password : hash//해시한 비밀번호 저장
                })
                res.redirect('/login')
            }
                
        }else{
            res.send('회원가입 실패 : 아이디 중복.');
        }

    }catch(error){
        console.error(error);
        res.status(500).send('서버 오류');
    }

})


//로그아웃기능
app.get('/logout', function(req, res){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/list/1');
    });
  });


//라우터폴더의 파일 사용
app.use('/shop', require('./routes/shop.js') )
app.use('/board/sub', require('./routes/board/sub.js'))


//검색기능 : mongodb search index 사용
app.post('/search', async (req, res) => {
    try {
        console.log(req.body.search_words);

        let search_condition = [
            { $search : { //어떤 필드에서 어떤 단어로 검색할지
                index : 'title_index',
                text : { query : req.body.search_words, path : 'title' }
            }},
            //$limit : 게시 갯수 제한해서 보여줌, $skip : 위에서 10개를 skip하고 가져옴(pagination 구현 용이)
            //$sort : { _id : 1 } id순으로 오름차순 정렬
            //$project : { _id : 0 } _id필드를 숨겨
        ]

        let results = await db.collection('post').aggregate(search_condition).toArray()
       
        if(results.length > 0) {
            res.render('search.ejs', { 글목록: results, user : req.user });
        } else { res.send("No items found") }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error occurred while processing your request");
    }
});
//검색결과 pagination


//채팅req기능
app.get('/chat/request', checkLogin,async(req, res)=>{
    await db.collection('chatroom').insertOne({
        member : [req.user._id, new ObjectId(req.query.writer_id)],
        date : new Date()
    })
  
    res.redirect('/chat/list')
})

//채팅방리스트기능
app.get('/chat/list',checkLogin, async(req, res)=>{
    
    let result = await db.collection('chatroom').find({
        member : req.user._id // member가 array여도 알아서 가져와줌
    }).toArray()

    res.render('chatList.ejs', {result : result, user : req.user})
})

//채팅방상세페이지기능
app.get('/chat/detail:id', async(req, res) => {
    try {
        let result = await db.collection('chatroom').findOne({
            _id : new ObjectId(req.params.id)
        })

        let result2 = await db.collection('chatmessage').find({
            room : new ObjectId(req.params.id)
        }).toArray()

        let userId = req.user._id.toString(); // ObjectId를 문자열로 변환
        let isMember = result.member.map(member => member.toString()).includes(userId);
        console.log(userId)

        if(isMember){//채팅방 내 멤버인지 확인
            res.render('chatDetail.ejs', {result : result, result2 : result2, userId : userId, user : req.user});
        } else {
            res.send('비정상적인 접근');
        }
    } catch (error) {
        console.error(error);
        res.send('서버 오류');
    }
});


// websocket연결
io.on('connection', async(socket)=>{//어떤 유저가 웹소켓으로 연결할때 코드 실행
    
    const session = socket.request.session;
    let userId = session.passport.user.id

    socket.on('ask-join', (data)=>{//room에 집어넣는 기능
        //socket.request.session 이용해서 채팅방에 참가한 유저들만 join하도록 예외처리 해야 함
        socket.join(data)
    })

    socket.on('message-send', async(data)=>{
        //특정 room에만 데이터 전송
        db.collection('chatmessage').insertOne({
            msg : data.msg,
            room :new ObjectId(data.room),
            date : new Date(),
            writer_id : new ObjectId(userId)
        })

        io.to(data.room).emit('message-broadcast', data.msg)

    })
})

// //server sent event (유저가 req 안해도 res 받을 수 있음)
// app.get('/stream/list', (req, res)=>{
//     res.writeHead(200, {//httpreq을 끊지 않고 유지
//         "Connection" : "keep-alive",
//         "Content-Type" : "text/event-stream",
//         "Cache-Control" : "no-cache"
//     })

//     // setInterval(()=>{
//     //     res.write('event: msg\n')
//     //     res.write('data: 바보\n\n')
//     // },1000)


// //change stream 사용
   
//     changeStream.on('change', (result)=>{
//         console.log(result.fullDocument)
//         res.write('event: msg\n')
//         res.write(`data: ${JSON.stringify(result.fullDocument)}\n\n`)
//     })
    
// })







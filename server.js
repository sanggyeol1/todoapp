const express = require('express');
const app = express();
const { ObjectId } = require('mongodb');
app.use(express.urlencoded({extended: true}))
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');
app.use('/public', express.static('public'))
require('dotenv').config()

var db;
MongoClient.connect(process.env.DB_URL, function(에러, client){
    if (에러) return console.log(에러);
    
    db = client.db('todoapp');

    app.listen(process.env.PORT, function(){
      console.log('listening on 8080')
    });
  })



app.get('/', (요청, 응답)=>{
    응답.sendFile(__dirname + '/index.html')
})

app.get('/write', (요청, 응답)=>{
    응답.render('write.ejs');
})




app.get('/list', function(요청, 응답){
    
    db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과)
        응답.render('list.ejs', {posts : 결과});
    
    })
})

app.get('/search', (요청, 응답)=>{
  var 검색조건 = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: 요청.query.value,
          path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    },
    { $sort : { _id : -1 } },
    { $limit : 10 },
    { $project : { title: 1, _id: 0, score: { $meta: "searchScore" } } }
  ] 
  db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
    console.log(결과)
    응답.render('search.ejs',{posts : 결과})
  })
})









app.get('/detail/:id', function(요청, 응답){

    db.collection('post').findOne({_id : parseInt(요청.params.id)}, function(에러, 결과){
        
        응답.render('detail.ejs', {결과 : 결과})
    })

    
})


app.get('/edit/:id', function(요청, 응답){
    
    db.collection('post').findOne({_id : parseInt(요청.params.id)}, function(에러, 결과){
        응답.render('edit.ejs', {결과 : 결과})
    })
})


app.post('/edit', (요청, 응답)=>{
        db.collection('post').updateOne({_id : parseInt(요청.body._id)},{
            $set : {
                title : 요청.body.title,
                date : 요청.body.date
            }
        },function(에러, 결과){

        })
        응답.send('수정 완료')
    })
    


const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 


app.get('/login', (요청, 응답)=>{
    응답.render('login.ejs');
})  

app.post('/login', passport.authenticate('local',{
    failureRedirect : '/fail'
}), (요청, 응답)=>{
  응답.redirect('/')
})



passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));


  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });//아이디를 이용해서 세션을 저장시키는 코드(로그인 성공시 발동)
  
  passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
      done(null, 결과)
    })
  }); //이 세션 데이터를 가진 사람을 db에서 찾아주세요(마이페이지 접속시 발동)



  app.get('/mypage', 로그인했니,function (요청, 응답){
    console.log(요청.user)
    응답.render('mypage.ejs',{사용자 : 요청.user})
  })
 
function 로그인했니(요청, 응답, next){
    if(요청.user){
        next()
    }else{
        응답.send('로그인 안하셨는데요')
    }
}



app.post('/register',(요청, 응답)=>{

  db.collection('login').findOne({id : 요청.body.id},(에러, 결과)=>{
    if(결과){
      응답.send('이미 존재하는 아이디입니다.')
    }else{
      db.collection('login').insertOne({id : 요청.body.id, pw : 요청.body.pw},(에러, 결과)=>{
        응답.redirect('/')
      })
    }
  })

  
})

app.post('/add', (요청, 응답)=>{
  db.collection('counter').findOne({name : '게시물 갯수'},function(에러, 결과){
      var 총게시물갯수 = 결과.totalPost

      var 저장할거 = {
        _id : 총게시물갯수 + 1,
        title : 요청.body.title,
        date : 요청.body.date,
        작성자 : 요청.user._id
      }

      db.collection('post').insertOne(저장할거, (에러, 결과)=>{ 
          db.collection('counter').updateOne({name : '게시물 갯수'},{ $inc : {totalPost:1} }, function(에러, 결과){
              if(에러){return console.log(에러)}
          })
      })
  })
  응답.send('저장 완료')

})

app.delete('/delete', function(요청, 응답){
    
  요청.body._id = parseInt(요청.body._id)

      db.collection('post').deleteOne(요청.body, function(에러, 결과){
        console.log('삭제완료');
        응답.status(200).send({message : '성공했습니다.'})
    })
   
})


app.use('/shop', require('./routes/shop.js'))
app.use('/board/sub', require('./routes/board.js'))




//이미지 업로드 코드
let multer = require('multer');
var storage = multer.diskStorage({

  destination : function(req, file, cb){
    cb(null, './public/image/') // 푸시할 경로
  },
  filename : function(req, file, cb){
    cb(null, file.originalname ) //파일명 설정
  }

});

var path = require('path');

var upload = multer({ // 제한걸기
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return callback(new Error('PNG, JPG만 업로드하세요'))
        }
        callback(null, true)
    },
    limits:{
        fileSize: 1024 * 1024 //1mb
    }
});

app.get('/upload', (요청, 응답)=>{
  응답.render('upload.ejs')
})

app.post('/upload', upload.single("profile"), function(요청, 응답){
  응답.send('업로드 완료')
})


//업로드한 이미지 보여주기
app.get('/image/:imageName', (요청, 응답)=>{
  응답.sendFile( __dirname + '/public/image/' + 요청.params.imageName)
})










//채팅방기능

app.post('/chatroom', 로그인했니, (req, res)=>{

  var 저장할거 = {
    title : '무슨무슨채팅방',
    member : [ ObjectId(req.body.당한사람id), req.user._id ],
    date : new Date(),
  }

  db.collection('chatroom').insertOne(저장할거).then((결과)=>{
    console.log('채팅성공')
  })
})





app.get('/chat',로그인했니 ,(req, res)=>{
  
  db.collection('chatroom').find({ member : req.user._id }).toArray().then((결과)=>{
    res.render('chat.ejs',{data : 결과})
  })
})


app.post('/message',로그인했니,(req, res)=>{
  var 저장할거 ={
    parent : req.body.parent,
    content : req.body.content,
    userid : req.user._id,
    date : new Date()
  }

  db.collection('message').insertOne(저장할거).then(()=>{
    console.log('저장완료')
  }).catch(()=>{
    console.log('저장실패')
  })
})



app.get('/message/:id', 로그인했니, function(요청, 응답){

  응답.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });


  db.collection('message').find({ parent : "요청.params.id" }).toArray().then((결과)=>{
    응답.write('event: test\n');
    응답.write('data: '+ JSON.stringify(결과) +'\n\n');//안녕하세요라는 데이터를 test라는 이벤트명으로 보냄
  })
  

});


const express = require('express')//express 라이브러리 사용하겠다.
const app = express()
const { MongoClient, ObjectId } = require('mongodb');//mongodb 연결, ObjectId 사용
const methodOverride = require('method-override')//메소드 오버라이딩 사용

app.use(methodOverride('_method'))//form태그에서 put요청, delete요청 가능
app.use(express.static(__dirname + '/public'))//퍼블릭 폴더 안의 static 파일 사용
app.set('view engine', 'ejs')//ejs사용 문법
app.use(express.json())
app.use(express.urlencoded({extended:true}))//요청.body쓰기위한 코드


//db에 연동하는 코드
let db;
const url = 'mongodb+srv://sanggyeol1:qwe123@cluster0.4pltbdt.mongodb.net/?retryWrites=true&w=majority' // mongodb/database/connect/drivers
new MongoClient(url).connect().then((client)=>{//디비와 연동
    console.log('DB연결성공')
    db = client.db('forum');
    const server = app.listen(8080, ()=>{//서버열기
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
app.post('/add', async(요청, 응답)=>{

    try{//코드먼저실행해보고
        if(요청.body.title=='' || 요청.body.content ==''){
            응답.send('제목또는 내용을 입력하시오')
        }else{
            await db.collection('post').insertOne({ title : 요청.body.title, content : 요청.body.content })
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
app.get('/edit/:id', async(요청, 응답)=>{
    let result = await db.collection('post').findOne({ _id : new ObjectId(요청.params.id) })
    응답.render('edit.ejs', { result : result })
  
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
    try{
        await db.collection('post').deleteOne({
            _id : new ObjectId(요청.query.docid)
        })
        응답.status(200).send('삭제완료') //ajax요청 시 새로고침이 안되므로 redirect 안해줌
    }catch(e){
        응답.status(500).send('An error occurred');
    }
    
})

// 페이지분할기능(데이터 적을때 버튼만들어 사용)
app.get('/list/:id', async (요청, 응답) => {
    //5개의 글 찾아서 result 변수에 저장하기
    let result = await db.collection('post').find().skip((요청.params.id-1) * 5).limit(5).toArray()//5개까지만 보여줌

    응답.render('list.ejs', { 글목록 : result })
  })

//다음버튼(빠르지만 1000페이지로 한번에 이동 불가능) 
app.get('/list/next/:id', async (요청, 응답) => {
    //5개의 글 찾아서 result 변수에 저장하기
    let result = await db.collection('post')
    .find({_id : { $gt : new ObjectId(요청.params.id) }})//방금본 마지막 글 다음글 찾음
    .limit(5).toArray() //5개까지만 보여줌

    응답.render('list.ejs', { 글목록 : result })
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
        응답.render('list.ejs', { 글목록: result });
    } catch (error) {
        // 오류 처리
        console.error(error);
        응답.status(500).send('서버 오류');
    }
});


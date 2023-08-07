var router = require('express').Router(); //npm 으로 설치했던 express라이브러리에 router기능을 쓰겠습니다.

function 로그인했니(요청, 응답, next){
    if(요청.user){
        next()
    }else{
        응답.send('로그인 안하셨는데요')
    }
}


router.use('/shirts', 로그인했니);

router.get('/shirts', (요청, 응답)=>{
    응답.send('셔츠 파는 페이지입니다.')
  })
  
router.get('/pants', (요청, 응답)=>{
    응답.send('바지 파는 페이지입니다.')
  })


module.exports = router;
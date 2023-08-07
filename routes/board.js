var router = require('express').Router(); //npm 으로 설치했던 express라이브러리에 router기능을 쓰겠습니다.

router.get('/sports', (요청, 응답)=>{
    응답.send('스포츠 게시판.')
  })
  
router.get('/game', (요청, 응답)=>{
    응답.send('게임게시판.')
  })


module.exports = router;

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http')




var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var io = require('socket.io');



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

let server=http.createServer(app).listen(8055,()=>{
  console.log('listen')
});

let i=io.listen(server)


let coin=200;
let userCoin=[
  
];

let users=[        //ID-KEY
  '18875288227',
  '18324111277'
];
let roomUsers=[];   //房间的用户
let userPoker=[      //用户的扑克牌  :  {user:...,poker:[...]}
  
];
let pokers=[
  'xa','x2','x3','x4','x5','x6','x7','x8','x9','x10','xj','xq','xk',    //红心
  'fa','f2','f3','f4','f5','f6','f7','f8','f9','f10','fj','fq','fk',    //方块
  'ma','m2','m3','m4','m5','m6','m7','m8','m9','m10','mj','mq','mk',    //梅花
  'ta','t2','t3','t4','t5','t6','t7','t8','t9','t10','tj','tq','tk',    //黑桃
  'ww','w'                                                               //大王小王
];
let pokersValue={
  xa:14,x2:2,x3:3,x4:4,x5:5,x6:6,x7:7,x8:8,x9:9,x10:10,xj:11,xq:12,xk:13,
  fa:14,f2:2,f3:3,f4:4,f5:5,f6:6,f7:7,f8:8,f9:9,f10:10,fj:11,fq:12,fk:13,
  ma:14,m2:2,m3:3,m4:4,m5:5,m6:6,m7:7,m8:8,m9:9,m10:10,mj:11,mq:12,mk:13,
  ta:14,t2:2,t3:3,t4:4,t5:5,t6:6,t7:7,t8:8,t9:9,t10:10,tj:11,tq:12,tk:13,
  w:15,ww:16,
}
let usersId=[
  [],[]
];      //每个用户的唯一标识符   用于断开连接  [users],[ids]
users.forEach((user)=>{
  userPoker.push({user:user,poker:[]});     //初始化用户的信息
});
users.forEach((user)=>{
  userCoin.push({user:user,coin:50000});     //初始化用户的金币
});

function getValue(obj){
  let val1=pokersValue[obj.poker[0]];
  let val2=pokersValue[obj.poker[1]];
  let totalVal=0;
  if(val1==val2==2){   //两个2
    totalVal=100;
  }else if(val1+val2==31){    //两个王
    totalVal=val1+val2+30;
  }else if(val1==val2){     //对子
    totalVal=val1+val2+30;
  }else{                       //正常
    totalVal=val1+val2;
  }
  return totalVal;
}

let gameRound=1;
let gameTimer;
let gameClose=false;    //用作定时器延迟判断

let double=1;   //倍数
let maxDouble=128;
let canDouble=true;   //能不能加倍

let dontGoList=[];      //不能 过 的名单
let goFunc=0;      //结束的方式   0:正常的比 1:过

let pkList=[];    //准备pk的名单

function startGame(){
  canDouble=true;   //开始游戏把加倍打开
  double=1;     //开始游戏把加倍归一
  dontGoList=[];  //开始游戏把不能 过 名单清除
  goFunc=0;    //改为正常比的模式
  pkList=[];    //pk名单清零
  let time=30;
  if(pokers.length<=2){   //如果牌只有两张了，就初始化牌库
    pokers=[
      'xa','x2','x3','x4','x5','x6','x7','x8','x9','x10','xj','xq','xk',    //红心
      'fa','f2','f3','f4','f5','f6','f7','f8','f9','f10','fj','fq','fk',    //方块
      'ma','m2','m3','m4','m5','m6','m7','m8','m9','m10','mj','mq','mk',    //梅花
      'ta','t2','t3','t4','t5','t6','t7','t8','t9','t10','tj','tq','tk',    //黑桃
      'ww','w' 
    ]
  }
  gameTimer=setInterval(()=>{
    roomUsers.forEach((item)=>{
      i.to(item).emit('time',time);
    });
    time--;
    if(time==-1){
      RoundOver();
    }
  },1000);
}
//回合结束函数
function RoundOver(loser){
      clearInterval(gameTimer);    //关闭定时器，系统进行判断
      //分析这一轮结果
      userPoker.forEach((obj)=>{   //没抽牌的情况
        if(obj.poker.length<2){
          for(let o=obj.poker.length;o<2;o++){
            //系统自动抽牌
            console.log('----------------抽牌+1');
            let thisIndex=Number.parseInt(Math.random()*(pokers.length-1))
            obj.poker.push(pokers[thisIndex]);
            pokers.splice(thisIndex,1);
            roomUsers.forEach((item)=>{
              let newUserPoker=JSON.parse(JSON.stringify(userPoker));
              newUserPoker.filter((obj)=>{     
                if(obj.user!=item && obj.poker.length==2){
                  obj.poker[1]='not';       //不是自己的牌  进行加密
                }
              }) 
              console.log(userPoker);
              i.to(item).emit('sendPoker',{total:pokers.length,userPoker:newUserPoker});
            });
          }
        }
      });
      canDouble=false;   //加倍 过 关闭

      let winner;
      if(goFunc==0){    //比
        winner=getValue(userPoker[0])>getValue(userPoker[1]) ? userPoker[0].user : getValue(userPoker[0])==getValue(userPoker[1]) ? '' : userPoker[1].user;
        // 平局 返回''
        console.log(winner+'获胜');
      }else{       //过
        console.log('loser is'+loser);
        roomUsers.forEach((user)=>{
          if(user!=loser){
            winner=user;
          }
        });
      }
      //进行扣分之类的
      if(winner!=''){   //平局不扣分
        if(goFunc==0){    //pk要进行倍数运算   2*2 特例  后面写
          userCoin.forEach((obj)=>{
            if(obj.user==winner){
              obj.coin+=(coin*double);
            }else{
              obj.coin-=(coin*double);
            }
          });
        }else{      //过  不进行倍数运算    
          userCoin.forEach((obj)=>{
            if(obj.user==winner){
              obj.coin+=coin;
            }else{
              obj.coin-=coin;
            }
          });
        }
        //发送给客户端
        roomUsers.forEach((item)=>{
          i.to(item).emit('coin',userCoin);
        })
      }
      roomUsers.forEach((item)=>{
        i.to(item).emit('win',winner);
        i.to(item).emit('sendPoker',{total:pokers.length,userPoker:userPoker});
      })
      setTimeout(()=>{
        //5秒缓冲后进行下一轮
        //递归+通知客户端
        if(!gameClose)    //如果有人离开了 就关闭游戏进程了  不再递归
        {
          gameRound++;
          roomUsers.forEach((item)=>{
            i.to(item).emit('reStart',gameRound);
          })
          userPoker.forEach((item)=>{
            item.poker=[];
          })
          startGame();  //递归
        }
      },8000);
}



i.on('connection', function (socket) {
  //pk
  socket.on('pk',(user)=>{
    if(canDouble){
      if(pkList.indexOf(user)==-1){  //第一次点pk按钮
        pkList.push(user);
        roomUsers.forEach((item)=>{
          i.to(item).emit('pk',pkList);
        })
      }else{
        //提示
        i.to(user).emit('sendAlert','你已经做好准备了，不能取消');
      }
      if(pkList.length==2){
        //双方都准备pk就执行下面的
        goFunc=0;
        RoundOver();
      }
      
    }
  });
  //过
  socket.on('go',(user)=>{
    if(canDouble){
      if(dontGoList.indexOf(user)==-1){  //此用户可以过
        console.log(user+'可以过');
                            //直接调用roundOver函数，只是改下中间获胜部分（用一个状态插入进去）
        goFunc=1;
        RoundOver(user);    //传入输家进去
        //扣此用户的分
        //通知客户端
      }else{
        //提示用户已经加倍，不能过了
        i.to(user).emit('sendAlert','你已经加倍了，不能过');
      }
    }
  })
  //加倍
  socket.on('double',(user)=>{
    if(canDouble){

      if(double<maxDouble){
        if(dontGoList.indexOf(user)==-1){   //推进不能 过 的名单中
          dontGoList.push(user);
          console.log(dontGoList);
        }
        double*=2;
        i.to(user).emit('sendAlert','加倍成功');
      }
      roomUsers.forEach((item)=>{
        i.to(item).emit('double',{user:user,double:double});
      });
    }
  });
  //加入
  socket.on('join',(user)=>{
    if(roomUsers.length<2){
      if(users.indexOf(user)!=-1  &&  roomUsers.indexOf(user)==-1)
      {
        socket.join(user);
        roomUsers.push(user);
        usersId[0].push(user);
        usersId[1].push(socket.id);
        console.log('当前在线人数:'+roomUsers.length);
        console.log(roomUsers);
        roomUsers.forEach((item)=>{
          i.to(item).emit('join',{code:200,msg:roomUsers});
        });
        roomUsers.forEach((item)=>{
          i.to(item).emit('coin',userCoin);
        })
        if(roomUsers.length==2){
          setTimeout(()=>{
            roomUsers.forEach((item)=>{
              i.to(item).emit('start',true);
            });
            clearInterval(gameTimer);
            gameRound=1;  //初始化轮数
            gameClose=false;
            startGame();  //开始游戏
          },1000);
        }
      }else{
        socket.join(user);
        i.to(user).emit('join',{code:0,msg:'KEY不对或者用户冲突'});
        socket.leave(user);
      }
    }else{
      socket.join(user);
      console.log('位置满了，挤不进来了');
      i.to(user).emit('join',{code:0,msg:'位置满了不好意思'});
      socket.leave(user);
    }
  })
  //离开
  socket.on('disconnect',(user)=>{
    if(usersId[1].indexOf(socket.id)!=-1){
      gameClose=true;
      clearInterval(gameTimer);//有一人走了就关闭定时器
      user=usersId[0][usersId[1].indexOf(socket.id)];
      roomUsers.forEach((item)=>{
        i.to(item).emit('leave',{code:200,msg:user});
      });
      roomUsers.splice(roomUsers.indexOf(user),1);
      let index=usersId[0].indexOf(user);
      usersId[0].splice(index,1);
      usersId[1].splice(index,1); 
      socket.leave(user);
      //只要有一人离开游戏就刷新变量  
      userPoker.forEach((obj)=>{
        obj.poker=[];
      });                  //初始化用户的牌
      pokers=[
        'xa','x2','x3','x4','x5','x6','x7','x8','x9','x10','xj','xq','xk',    //红心
        'fa','f2','f3','f4','f5','f6','f7','f8','f9','f10','fj','fq','fk',    //方块
        'ma','m2','m3','m4','m5','m6','m7','m8','m9','m10','mj','mq','mk',    //梅花
        'ta','t2','t3','t4','t5','t6','t7','t8','t9','t10','tj','tq','tk',    //黑桃
        'ww','w'                                                               //大王小王
      ];    //初始化总牌
    }
    console.log('当前在线人数:'+roomUsers.length);
    console.log(roomUsers);
  });



  //拿牌
  socket.on('sendPoker',(user)=>{
    let state=true;
    userPoker.forEach((obj)=>{
      if(obj.user==user){
        if(obj.poker.length==2){    //牌抽满了
          i.to(user).emit('sendAlert','只能抽两张牌');
          state=false;
        }else{
          let thisIndex=Number.parseInt(Math.random()*(pokers.length-1))
          obj.poker.push(pokers[thisIndex]);
          pokers.splice(thisIndex,1);
        }
      }
    });
    if(state){
      roomUsers.forEach((item)=>{
          let newUserPoker=JSON.parse(JSON.stringify(userPoker));
          newUserPoker.filter((obj)=>{     
            if(obj.user!=item && obj.poker.length==2){
              obj.poker[1]='not';       //不是自己的牌  进行加密
            }
          }) 
          console.log(userPoker);
          i.to(item).emit('sendPoker',{total:pokers.length,userPoker:newUserPoker});
      });
    }
  })
})



module.exports = app;

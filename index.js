const express = require('express');
const http = require('http');
const axios = require('axios');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const app = express();
const cookieparser = require('cookie-parser');
const session = require('express-session');
const cookie = require('cookie'); 
const socketIoExpressSession = require('socket.io-express-session');
const { setTimeout } = require('timers');
const server = http.createServer(app);
const io = socketIo(server);
let timer;
let disable =false;

function getCookieValue(cookieString, cookieName) {
    const cookies = cookieString.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(cookieName)) {
        const parts = cookie.split('=');
        if (parts.length === 2) {
          return decodeURIComponent(parts[1]);
        }
      }
    }
    return null;
  }
app.use(cookieparser());
app.use(express.static('statics'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let users = [];
let roomusers = {};
let gameusers = {};

io.on('connection', (socket) => {
    socket.emit("connected1",users);
    socket.emit("connected2",roomusers);

    socket.on('login', (msg) => {
        msg.serial = socket.id;
        if(msg.serial){
            users.push(msg);
            io.emit("newUser",msg);
        }
    });
    
    socket.on('disconnect', () => {
        socket.broadcast.emit('outUser',{serial : socket.id});
        let cnt =0;
        let find = -1;
        for(const element of users){
            if(element.serial == socket.id){
                break;
            }
            cnt++;
        }
        users.splice(cnt,1);
    });
    socket.on("page",(puser)=>{
        puser.userinfo.serial = socket.id;
        if(puser.userinfo.serial && puser.roominfo){
            users.push(puser.userinfo);
            socket.join(puser.roominfo);
            if(!roomusers[puser.roominfo]){
                roomusers[puser.roominfo] = [];
                io.emit("newRoom",puser.roominfo);
                socket.emit("king",puser.userinfo.serial);
            }
        roomusers[puser.roominfo].push(puser.userinfo);
      console.log(roomusers[puser.roominfo])
        socket.broadcast.to(puser.roominfo).emit("newUserRoom",puser.userinfo);
        socket.broadcast.emit("newUser",puser.userinfo);
        socket.emit("inroom",roomusers[puser.roominfo]);
        socket.on('disconnect',()=>{
            let cnt =0;
            let find = -1;
            for(const element of roomusers[puser.roominfo]){
                if(element.serial == socket.id){
                    break;
                }
                cnt++;
            }
            roomusers[puser.roominfo].splice(cnt,1);
            
            socket.broadcast.to(puser.roominfo).emit("outUserRoom",puser.userinfo);
           if(!roomusers[puser.roominfo].length){
                delete roomusers[puser.roominfo];
                io.emit("deleteroom",puser.roominfo);
            }else{
                io.to(puser.roominfo).emit("king",roomusers[puser.roominfo][0].serial);
            }
        });
        socket.on("king",()=>{
            if(socket.id == roomusers[puser.roominfo][0].serial && roomusers[puser.roominfo].length > 1){
                for(const element of roomusers[puser.roominfo]){
                    io.to(puser.roominfo).emit("start");
                }
            }else{
                io.to(puser.roominfo).emit("error");
            }
        });
        }
    });
    socket.on("game",(guser)=>{
        if(!gameusers[guser.roomname]){
            gameusers[guser.roomname] = {
                start : 0,
                users : [],
                usedword : []
            };
        }
        if(!gameusers[guser.roomname].start){
            io.emit("newUser",{id : guser.userid, serial : socket.id});
            gameusers[guser.roomname].users.push({id : guser.userid, serial : socket.id});
            users.push({id : guser.userid, serial : socket.id});
            socket.join(guser.roomname);
            setTimeout(() => {
                if(gameusers[guser.roomname].users[0].serial == socket.id){
                   socket.emit('turned',guser);
                   io.to(guser.roomname).emit("start",gameusers[guser.roomname]);
                   gameusers[guser.roomname].start = 1;
                }
            }, 5000);
        }
        socket.on("disconnect",()=>
        {
            io.to(guser.roomname).emit("whout");
            setTimeout(()=>{
                io.to(guser.roomname).emit("gameover");
                },2000);
        });
    });
    socket.on("turn",(guser)=>{
        disable = false;
        let turn = gameusers[guser.roomname].usedword.length;
        socket.emit("turn",turn);
        socket.broadcast.to(guser.roomname).emit("noturn",turn);
        timer = setTimeout(()=>{
            io.to(guser.roomname).emit("timeout");
            disable = true; 
            setTimeout(()=>{
            io.to(guser.roomname).emit("gameover");
            },2000);
            setTimeout(()=>{
                delete gameusers[guser.roomname];
            },3000);
        },30000-turn*10);
    });
    socket.on("word",(wordinfo)=>{
        // console.log(wordinfo.user);
        let lastword_lastchar,lastwordindex;
        let turn = gameusers[wordinfo.roomname].usedword.length;
        if(turn!=0){
            //console.log(gameusers[wordinfo.roomname].usedword);
            lastwordindex= gameusers[wordinfo.roomname].usedword.length-1;
            lastword_lastchar = gameusers[wordinfo.roomname].usedword[lastwordindex].charAt(gameusers[wordinfo.roomname].usedword[lastwordindex].length-1);
        }
        if(!disable){
            if(wordinfo.userid == socket.id && (turn == 0 || lastword_lastchar == wordinfo.word.charAt(0)) && gameusers[wordinfo.roomname].users[(turn%gameusers[wordinfo.roomname].users.length)].serial == wordinfo.userid){
                axios.get('https://stdict.korean.go.kr/api/search.do',
                {params : {
                    key : 'A2A9F0B053BAFA67003349C20EFFDF07',
                    q : wordinfo.word,
                    req_type : 'json'
                }})
                 .then(response => {
                    if(response.data && !gameusers[wordinfo.roomname].usedword.includes(wordinfo.word)){
                        clearTimeout(timer);
                        io.to(wordinfo.roomname).emit("good_word",{word : wordinfo.word,user : wordinfo.user, userid : wordinfo.userid ,describe : response.data.channel.item[0].sense.definition, point : wordinfo.word.length*10,lastword : wordinfo.word.charAt(wordinfo.word.length-1)});
                        gameusers[wordinfo.roomname].usedword.push(wordinfo.word);
                        io.to(gameusers[wordinfo.roomname].users[(turn+1)% gameusers[wordinfo.roomname].users.length].serial).emit("turned",{userid : wordinfo.user , serial : wordinfo.userid,roomname : wordinfo.roomname,lastword: wordinfo.word.charAt(wordinfo.word.length-1)});
                        return;
                    }else{
                        io.to(wordinfo.roomname).emit("wrong_word",wordinfo);
                    }
                })
                .catch(error => {
                   // console.error('API 요청 중 오류 발생: ' + error);
                    io.to(wordinfo.roomname).emit("wrong_word",wordinfo);
                });
            }else{
                io.to(wordinfo.roomname).emit("wrong_word",wordinfo);
            }
        }
    })
});
// if 게임이 진행줄일때 접속하면 잘못된 접근 띄움
server.listen(3000, () => {
});
app.get('/',(req,res)=>{
    res.render('index.ejs');
});
app.post('/find',(req,res)=>{
    res.redirect('')
});
app.post('/make', (req, res) => {
    const postData = req.body.input;
    if(postData){
        res.redirect(`/room/${postData}`);
    }else{
        res.redirect('/');
    }
});
app.get('/room/:id', (req, res) => {
    let roomid = req.params.id;
    const userid =getCookieValue(req.headers.cookie,'id');
    res.render('room.ejs', { roomid : roomid,  userid :
        userid});
});
app.get('/game/:id', (req, res) => {
    let roomid = req.params.id;
    const userid =getCookieValue(req.headers.cookie,'id');
    if(!gameusers[roomid]||gameusers[roomid].start != 1){
        
    res.render('game.ejs', { roomid : roomid,  userid :
        userid});
    }
        else{
            res.status(403).render('403.ejs');
        }
});
app.use((req, res) => {
    res.status(404).render('404.ejs');
});
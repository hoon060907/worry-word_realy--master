const socket = io();
const score_out = document.getElementById("score-out");
const loadar = document.getElementById("load");
const now = document.getElementById("now");
const next = document.getElementById("next");
const before = document.getElementById("before");
const loadarp = document.querySelector(".timer");
const body = document.querySelector("body");
// const before2 = document.querySelector('.before2');
const before2 = document.querySelector(".first");
// const before2_text1 = document.querySelector('.before2 > .word >  div:first-child > p');
const before2_text1 = document.querySelector(".first > h3");
// const before2_text2 = document.querySelector('.before2 >  .word > div:nth-child(2) > p');
const before2_text2 = document.querySelector(".first > p");
// const before1 = document.querySelector('.before1');
const before1 = document.querySelector(".second");
// const before1_text1 = document.querySelector('.before1 >  .word >  div:first-child > p');
const before1_text1 = document.querySelector(".second > h2");
// const before1_text2 = document.querySelector('.before1 > .word > div:nth-child(2) > p');
const before1_text2 = document.querySelector(".second > p");
// const nower_text1 = document.querySelector('.nower > .word > div:first-child > p');
const nower_text1 = document.querySelector(".current > h1");
// const nower_text2 = document.querySelector('.nower > .word > div:nth-child(2) > input');
const nower_text2 = document.querySelector(".current > input");
// const nower = document.querySelector('.nower');
const nower = document.querySelector(".current");
let now_word = document.getElementById("word-input");
const popup = document.getElementById("popup");
const popuptext = document.querySelector("#popup > p");
const nowpath = window.location.pathname;
const roomName = nowpath.slice(6, nowpath.length + 1);
const dummy = document.querySelector(".dummy");
const dummy_text1 = document.querySelector(".dummy > h4");
const dummy_text2 = document.querySelector(".dummy > p");
let gamescore = {};
let gusers = [];
function getCookieValue(cookieName) {
  const name = cookieName + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(";");

  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
}
const user = getCookieValue("id");
function word_check(event) {
  if (event.keyCode == 13 && myturn == 1 && now_word.value) {
    event.preventDefault();
    socket.emit("word", {
      userid: socket.id,
      user: user,
      word: now_word.value,
      roomname: roomName,
    });
    now_word.value = "";
  }
}
now_word.addEventListener("keypress", word_check);
let timer;
let myturn = 0;
document.addEventListener("DOMContentLoaded", () => {
  const interval = 10;
  let remainingTime = 0;
  function updateBar() {
    if (remainingTime > 0) {
      remainingTime--;
      barWidth = (remainingTime / 1000) * 100;
      loadarp.textContent = remainingTime / 100 + "s";
      // loadar.style.background = `linear-gradient(90deg,#00B4DB 0% ,#0083B0 ${barWidth}% )`;
    } else {
      clearInterval(timer);
    }
  }
  socket.emit("game", { userid: user, serial: socket.id, roomname: roomName });

  popup.style.display = "flex";
  socket.on("turn", (turn) => {
    myturn = 1;
    nower_text2.style.display = "flex";
    // body.style.background = "#FFC2D7";

    if (turn == 0) {
      nower_text1.textContent = "처음입니다.";
      before.textContent = "시작";
      now.textContent = gusers[turn % gusers.length];
      next.textContent = gusers[(turn + 1) % gusers.length];
    } else {
      if ((turn % gusers.length) - 1 < 0) {
        before.textContent = gusers[(turn % gusers.length) - 1 + gusers.length];
      } else {
        before.textContent = gusers[(turn % gusers.length) - 1];
      }
      now.textContent = gusers[turn % gusers.length];
      next.textContent = gusers[(turn + 1) % gusers.length];
    }
    remainingTime = Math.round((30000 - 10 * turn) / 10);
    timer = setInterval(updateBar, interval);
  });
  socket.on("noturn", (turn) => {
    if (turn == 0) {
      nower_text1.textContent = "처음입니다.";
      before.textContent = "시작";
    } else {
      if ((turn % gusers.length) - 1 < 0) {
        before.textContent = gusers[(turn % gusers.length) - 1 + gusers.length];
      } else {
        before.textContent = gusers[(turn % gusers.length) - 1];
      }
    }
    console.log(
      gusers[turn % gusers.length],
      gusers[(turn + 1) % gusers.length]
    );
    now.textContent = gusers[turn % gusers.length];
    next.textContent = gusers[(turn + 1) % gusers.length];
    // body.style.background = "#8EE2FF";
    nower_text2.style.display = "none";
    myturn = 0;
    remainingTime = Math.round((30000 - 11 * turn) / 10);
    loadarp.textContent = remainingTime / 100 + "s";
    // loadar.style.background = `linear-gradient(90deg,#00B4DB 0% ,#0083B0 % )`;
    timer = setInterval(updateBar, interval);
  });
  socket.on("turned", (guser) => {
    socket.emit("turn", guser);
  });
  socket.on("start", (gameusers) => {
    popup.style.display = "none";
    for (const element of gameusers.users) {
      if (element == null) {
        continue;
      }
      gusers.push(element.id);
      const newDiv = document.createElement("div");
      gamescore[element.serial] = 0;
      newDiv.setAttribute("id", "a" + element.serial);
      newDiv.setAttribute("class", "score");
      const newP = document.createElement("b");
      const newP2 = document.createElement("b");
      newP.textContent = element.id;
      newP2.textContent = "0점";
      newDiv.appendChild(newP);
      newDiv.appendChild(newP2);

      score_out.appendChild(newDiv);
    }
  });
  socket.on("good_word", (wordinfo) => {
    clearInterval(timer);
    myturn = 0;
    // body.style.background = "#8EE2FF";
    const update = document.querySelector(
      `#a${wordinfo.userid} > b:nth-child(2)`
    );
    gamescore[wordinfo.userid] += wordinfo.point;
    update.textContent = gamescore[wordinfo.userid] + "점";
    if (before1.style.opacity == 0) {
      // before1.style.display = 'flex';
      before1.style.opacity = 1;
      before1_text1.textContent = wordinfo.word;
      before1_text2.textContent = wordinfo.describe;
      nower_text1.textContent = wordinfo.lastword;
      nower_text2.style.display = "none";
      before2.classList.add("firstanim");
      before1.classList.add("secondanim");
      setTimeout(() => {
        before1.classList.remove("secondanim");
        before2.classList.remove("firstanim");
      }, 1500);
    } else if (before2.style.opacity == 0) {
      // before2.style.display = 'flex';
      before2.style.opacity = 1;
      before2_text1.textContent = before1_text1.textContent;
      before2_text2.textContent = before1_text2.textContent;
      before1_text1.textContent = wordinfo.word;
      before1_text2.textContent = wordinfo.describe;
      nower_text1.textContent = wordinfo.lastword;
      nower_text2.style.display = "none";
      before2.classList.add("firstanim");
      before1.classList.add("secondanim");
      setTimeout(() => {
        before1.classList.remove("secondanim");
        before2.classList.remove("firstanim");
      }, 1500);
    } else {
      dummy_text1.textContent = before2_text1.textContent;
      dummy_text2.textContent = before2_text2.textContent;
      before2_text1.textContent = before1_text1.textContent;
      before2_text2.textContent = before1_text2.textContent;
      before1_text1.textContent = wordinfo.word;
      before1_text2.textContent = wordinfo.describe;
      nower_text1.textContent = wordinfo.lastword;
      nower_text2.style.display = "none";
      before2.classList.add("firstanim");
      before1.classList.add("secondanim");
      dummy.classList.add("dummyanim");
      setTimeout(() => {
        dummy.classList.remove("dummyanim");
        before1.classList.remove("secondanim");
        before2.classList.remove("firstanim");
      }, 1500);
    }
    //console.log(wordinfo.lastword);
  });
  socket.on("wrong_word", (wordinfo) => {
    // 해당아이디를 찾아서 빨간색으로 표시하기
    const update = document.querySelector(
      `#a${wordinfo.userid} > b:first-child`
    );
    update.style.color = "pink";
    let temp = nower_text1.textContent;
    nower_text1.textContent = "잘못된 단어입니다.";
    setTimeout(() => {
      update.style.color = "white";
      nower_text1.textContent = temp;
    }, 500);
  });

  socket.on("timeout", () => {
    popup.style.display = "flex";
    popuptext.textContent =
      "시간이 종료되었습니다. 잠시후 메인화면으로 돌아갑니다";
  });
  socket.on("whout", () => {
    popup.style.display = "flex";
    popuptext.textContent = "누군가 접속을 종료했습니다.";
  });

  socket.on("gameover", () => {
    window.location.href = `/room/${roomName}`;
  });
});

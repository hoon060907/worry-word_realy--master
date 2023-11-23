const socket = io();
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
const userNameC = document.getElementById("userNameC");
const insert = document.getElementById("insert");
const nowpath = window.location.pathname;
console.log(nowpath);
const roomName = nowpath.slice(6, nowpath.length + 1);
document.getElementById("room-name").innerText = roomName;
userNameC.textContent = user;
setTimeout(() => {
  socket.emit("page", {
    userinfo: { id: user, serial: socket.id },
    roominfo: roomName,
  });
}, 1000);
let cnt = 0;
socket.on("inroom", (users) => {
  for (const element of users) {
    console.log(element);
    const newDiv = document.createElement("div");
    if (cnt == 0) {
      newDiv.setAttribute("class", "inbox king");
    } else {
      newDiv.setAttribute("class", "inbox");
    }
    newDiv.setAttribute("id", "a" + element.serial);
    const newP = document.createElement("p");
    newP.textContent = element.id;
    newDiv.appendChild(newP);
    insert.appendChild(newDiv);
    cnt++;
  }
});
socket.on("newUserRoom", (user) => {
  console.log("newUserRoom");
  const newDiv = document.createElement("div");
  newDiv.setAttribute("id", "a" + user.serial);
  newDiv.setAttribute("class", "inbox");
  const newP = document.createElement("p");
  newP.textContent = user.id;
  newDiv.appendChild(newP);
  insert.appendChild(newDiv);
});
socket.on("outUserRoom", (user) => {
  const deletediv = document.getElementById("a" + user.serial);
  if (deletediv) {
    deletediv.remove();
  }
});
console.log(user);
socket.on("king", (userd) => {
  setTimeout(() => {
    const me = document.getElementById("a" + userd);
    me.classList.add("king");
    if (userd == socket.id) {
      const only = document.getElementById("only");
      only.style.display = "block";
    }
  }, 1000);
});
function start() {
  socket.emit("king");
}
socket.on("start", () => {
  window.location.href = `/game/${roomName}`;
});

socket.on("error", () => {
  // alert("인원이 부족해 시작을 못하거나 방장이 아닌 사람이 시작을 눌렀습니다");
  Swal.fire({
    icon: "error",
    text: "인원이 부족해 시작을 못하거나 방장이 아닌 사람이 시작을 눌렀습니다",
    heightAuto: false,
  });
});

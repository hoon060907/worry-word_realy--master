const socket = io();
const closePopupButton = document.getElementById("closePopup");
const popup = document.getElementById("popup");
const userName = document.getElementById("user-input");
const userNameC = document.getElementById("userNameC");
const useroutbox = document.getElementById("useron-outbox");
const roomoutbox = document.getElementById("room-outbox");
const roomEnterForm = document.getElementById("form2");

window.onload = function () {
  popup.style.display = "flex";
};

var user = null;
document
  .getElementById("noRefreshButton")
  .addEventListener("click", function (event) {
    event.preventDefault();
    user = userName.value;
    userNameC.innerText = user;
    socket.emit("login", {
      id: userName.value,
      serial: socket.id,
    });
    popup.style.display = "none";
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `id = ${
      userName.value
    } ; expires=${expires.toUTCString()};`;
    //roomEnterForm.action = '/room/'+userName.value;
  });

const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "attributes" && mutation.attributeName === "style") {
      const computedStyle = getComputedStyle(popup);
      if (computedStyle.display === "none" && user == null) {
        // display 속성이 'none'으로 변경될 때 실행할 함수
        elementHiddenHandler();
      }
    }
  }
});

const config = { attributes: true, attributeFilter: ["style"] };
observer.observe(popup, config);

function elementHiddenHandler() {
  popup.style.display = "flex";
}

socket.on("connected1", (users) => {
  console.log(users);
  for (const element of users) {
    if (element == null) {
      continue;
    }
    const newDiv = document.createElement("div");

    newDiv.setAttribute("id", "a" + element.serial);
    newDiv.setAttribute("class", "inbox");
    const newP = document.createElement("p");
    newP.textContent = element.id;

    newDiv.appendChild(newP);

    useroutbox.appendChild(newDiv);
  }
  console.log(users);
});
socket.on("newUser", (user) => {
  console.log(user);
  const newDiv = document.createElement("div");

  newDiv.setAttribute("id", "a" + user.serial);
  newDiv.setAttribute("class", "inbox");
  const newP = document.createElement("p");
  newP.textContent = user.id;

  newDiv.appendChild(newP);

  useroutbox.appendChild(newDiv);
});
socket.on("outUser", (user) => {
  const deletediv = document.getElementById("a" + user.serial);
  if (deletediv) {
    deletediv.remove();
  }
});
socket.on("connected2", (roomusers) => {
  for (let key in roomusers) {
    const newDiv = document.createElement("div");
    const newAt = document.createElement("a");
    newDiv.setAttribute("id", "a" + key);
    newDiv.setAttribute("class", "inbox");
    newAt.href = `/room/${key}`;
    const newP = document.createElement("p");
    newP.textContent = key;
    newAt.appendChild(newP);
    newDiv.appendChild(newAt);
    roomoutbox.appendChild(newDiv);
  }
});
socket.on("deleteroom", (room) => {
  const deletediv = document.getElementById("a" + room);
  if (deletediv) {
    deletediv.remove();
  }
});
socket.on("newRoom", (room) => {
  const newDiv = document.createElement("div");
  const newAt = document.createElement("a");
  newDiv.setAttribute("id", "a" + room);
  newDiv.setAttribute("class", "inbox");
  newAt.href = `/room/${room}`;
  newAt.style.color = "black";
  const newP = document.createElement("p");
  newP.textContent = room;
  newAt.appendChild(newP);
  newDiv.appendChild(newAt);
  roomoutbox.appendChild(newDiv);
});

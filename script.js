const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");

let room = "";

const roomInput = document.getElementById("room");
const joinBtn = document.getElementById("join");

const msgInput = document.getElementById("message");
const sendBtn = document.getElementById("send");

const messages = document.getElementById("messages");

const id = Math.random().toString(36).slice(2);

joinBtn.onclick = () => {

    room = roomInput.value.trim();

    if(!room) return;

    client.subscribe("chat/"+room);

    add("Conectado a la sala.");
};

client.on("message",(topic,data)=>{

    const msg = JSON.parse(data);

    add(msg.user+": "+msg.text);

});

sendBtn.onclick = ()=>{

    if(!room) return;

    const packet={

        user:id,
        text:msgInput.value

    };

    client.publish(
        "chat/"+room,
        JSON.stringify(packet)
    );

    msgInput.value="";
};

function add(text){

    const div=document.createElement("div");

    div.className="msg";

    div.textContent=text;

    messages.appendChild(div);

    messages.scrollTop=messages.scrollHeight;

}

// ---------- NICKS ----------

const emojis = [
    "🐱","🐶","🦊","🐸","🐧","🦆","🦈","🐼","🐙","🐢",
    "🐝","🦉","🐺","🦁","🐯","🐨","🦥","🐿️","🐬","🦖",
    "🤖","👾","🐉","🦄","🐌","🦀","🦕","🐳","🦜","🦝"
];

const adjetivos = [
    "Cósmico","Turbo","Supremo","Feliz","Épico","Legendario",
    "Misterioso","Saltarín","Galáctico","Atómico","Radiante",
    "Infinito","Brillante","Valiente","Cuántico","Explosivo",
    "Sigiloso","Pixelado","Caótico","Lunar","Electrizante"
];

const sustantivos = [
    "Gato","Patata","Pingüino","Pizza","Rana","Tiburón",
    "Zorro","Pato","Dragón","Hámster","Robot","Ninja",
    "Koala","Pulpo","Aguacate","Cactus","Mapache","Burrito",
    "Fantasma","Meteorito","Café","Queso"
];

function aleatorio(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
}

function generarNick() {
    return `${aleatorio(emojis)} ${aleatorio(sustantivos)}${aleatorio(adjetivos)}${Math.floor(Math.random() * 1000)}`;
}

let id = localStorage.getItem("nick");

if (!id) {
    id = generarNick();
    localStorage.setItem("nick", id);
}

// ---------- MQTT ----------

const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");

let room = "";

// ---------- ELEMENTOS ----------

const roomInput = document.getElementById("room");
const joinBtn = document.getElementById("join");

const msgInput = document.getElementById("message");
const sendBtn = document.getElementById("send");

const messages = document.getElementById("messages");

const nickLabel = document.getElementById("nick");
const randomBtn = document.getElementById("randomNick");

// ---------- NICK ----------

function actualizarNick() {
    nickLabel.textContent = "Tu nick: " + id;
}

actualizarNick();

randomBtn.onclick = () => {

    id = generarNick();

    localStorage.setItem("nick", id);

    actualizarNick();

};

// ---------- UNIRSE ----------

joinBtn.onclick = () => {

    room = roomInput.value.trim();

    if (!room) return;

    client.subscribe("chat/" + room);

    add("🟢 Conectado a la sala.");

};

// ---------- RECIBIR ----------

client.on("message", (topic, data) => {

    const msg = JSON.parse(data);

    add(`${msg.user}: ${msg.text}`);

});

// ---------- ENVIAR ----------

function enviar() {

    if (!room) return;

    const texto = msgInput.value.trim();

    if (!texto) return;

    client.publish(
        "chat/" + room,
        JSON.stringify({
            user: id,
            text: texto
        })
    );

    msgInput.value = "";

}

sendBtn.onclick = enviar;

// Enviar pulsando Enter
msgInput.addEventListener("keydown", e => {

    if (e.key === "Enter") {

        enviar();

    }

});

// ---------- MENSAJES ----------

function add(text) {

    const div = document.createElement("div");

    div.className = "msg";

    div.textContent = text;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;

}

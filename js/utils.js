/* ═══════════════════════════════════════════════════════════════════════
   MiniChat · js/utils.js
═══════════════════════════════════════════════════════════════════════ */
'use strict';

const $ = sel => document.querySelector(sel);
const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
};

const fmtTime = d => String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10));

function nickColor(str){
  let h = 0;
  for (const ch of String(str)) h = (h + ch.codePointAt(0)) % 360;
  return `hsl(${h} 72% 68%)`;
}

function emojiOf(nick){
  const first = String(nick || '').split(/\s+/)[0] || '';
  try { return /\p{Extended_Pictographic}/u.test(first) ? first : '💬'; }
  catch(e){ return first || '💬'; }
}

let toastTimer = null;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
}

// Nick Generator Data
const NOMBRES = [
  ['🐧','Pingüino','m'],['🦊','Zorro','m'],['🦆','Pato','m'],['🐺','Lobo','m'],
  ['🐱','Gato','m'],['🐶','Perrito','m'],['🐼','Panda','m'],['🐨','Koala','m'],
  ['🐯','Tigre','m'],['🦁','León','m'],['🦅','Águila','f'],['🦉','Búho','m'],
  ['🐬','Delfín','m'],['🦈','Tiburón','m'],['🐙','Pulpo','m'],['🦑','Calamar','m'],
  ['🐢','Tortuga','f'],['🦎','Lagarto','m'],['🐸','Rana','f'],['🦔','Erizo','m'],
  ['🦝','Mapache','m'],['🦫','Castor','m'],['🦦','Nutria','f'],['🦨','Mofeta','f'],
  ['🐿️','Ardilla','f'],['🐹','Hámster','m'],['🐰','Conejo','m'],['🦇','Murciélago','m'],
  ['🦩','Flamenco','m'],['🦢','Cisne','m'],['🦜','Loro','m'],['🐦','Pajarito','m'],
  ['🐴','Caballo','m'],['🦄','Unicornio','m'],['🐮','Vaca','f'],['🐷','Cerdito','m'],
  ['🐑','Oveja','f'],['🐐','Cabra','f'],['🦌','Ciervo','m'],['🦬','Bisonte','m'],
  ['🐘','Elefante','m'],['🦏','Rinoceronte','m'],['🦛','Hipopótamo','m'],['🐪','Camello','m'],
  ['🦙','Llama','f'],['🦘','Canguro','m'],['🦡','Tejón','m'],['🦥','Perezoso','m'],
  ['🦧','Orangután','m'],['🦍','Gorila','m'],['🐒','Monito','m'],['🐊','Cocodrilo','m'],
  ['🐉','Dragón','m'],['🦖','T-Rex','m'],['🦕','Brontosaurio','m'],['🐋','Ballena','f'],
  ['🦭','Foquita','f'],['🦚','PavoReal','m'],['🐓','Gallo','m'],['🐤','Pollito','m'],
  ['🍕','Pizza','f'],['🍔','Hamburguesa','f'],['🌭','Perrito','m'],['🍟','PatataFrita','f'],
  ['🌮','Taco','m'],['🌯','Burrito','m'],['🥑','Aguacate','m'],['🍣','Sushi','m'],
  ['🍜','Ramen','m'],['🍩','Dónut','m'],['🍪','Galleta','f'],['🧁','Cupcake','m'],
  ['🎂','Pastel','m'],['🍰','Tarta','f'],['🍦','Helado','m'],['🍫','Chocolate','m'],
  ['🍬','Caramelo','m'],['🍭','Piruleta','f'],['🥐','Croissant','m'],['🥨','Pretzel','m'],
  ['🧇','Gofre','m'],['🥞','Tortita','f'],['🍿','Palomita','f'],['🍉','Sandía','f'],
  ['🍓','Fresa','f'],['🍒','Cereza','f'],['🍑','Melocotón','m'],['🍍','Piña','f'],
  ['🥭','Mango','m'],['🍋','Limón','m'],['🥝','Kiwi','m'],['🫐','Arándano','m'],
  ['🥥','Coco','m'],['🍵','Matcha','m'],['☕','Cafelito','m'],['🧋','BobaTea','m'],
  ['🥟','Dumpling','m'],['🍙','Onigiri','m'],['🍤','Gambita','f'],['🫓','Arepa','f'],
  ['🤖','Robot','m'],['🎮','Mando','m'],['🕹️','Joystick','m'],['📼','Casete','m'],
  ['💾','Disquete','m'],['📻','Radio','f'],['📺','Tele','f'],['💡','Bombilla','f'],
  ['🔦','Linterna','f'],['🔮','BolaCristal','f'],['🎲','Dado','m'],['🧩','Puzzle','m'],
  ['🎈','Globo','m'],['🎪','Circo','m'],['🎩','Sombrero','m'],['⌚','Reloj','m'],
  ['⚙️','Engranaje','m'],['📦','Paquete','m'],['🗿','Moái','m'],['🪩','BolaDisco','f'],
  ['🎺','Trompeta','f'],['🎸','Guitarra','f'],['🥁','Batería','f'],['🎻','Violín','m'],
  ['🧸','Peluche','m'],['🪀','Yoyó','m'],['🎳','Bolos','m'],['🪄','Varita','f'],
  ['🌌','Galaxia','f'],['⭐','Estrella','f'],['🌟','Supernova','f'],['☄️','Cometa','m'],
  ['🪐','Planeta','m'],['🌙','Luna','f'],['🌕','LunaLlena','f'],['☀️','Sol','m'],
  ['🌈','Arcoíris','m'],['🌠','EstrellaFugaz','f'],['🛰️','Satélite','m'],['🔭','Telescopio','m'],
  ['👽','Alien','m'],['🧑‍🚀','Astronauta','m'],['💫','Nebulosa','f'],['🕳️','AgujeroNegro','m'],
  ['🛸','Ovni','m'],['🚀','Cohete','m'],
  ['🧪','Matraz','m'],['⚗️','Alambique','m'],['🧬','ADN','m'],['🦠','Microbio','m'],
  ['⚛️','Átomo','m'],['⚡','Electrón','m'],['🔬','Microscopio','m'],['🧲','Imán','m'],
  ['💊','Píldora','f'],['🔋','Batería','f'],['🌡️','Termómetro','m'],['🧠','Cerebro','m'],
  ['💎','Cristal','m'],['🪨','Meteorito','m'],['🌋','Volcán','m'],['🌪️','Tornado','m'],
  ['👾','Invasor','m'],['🏆','Campeón','m'],['🗡️','Espada','f'],['🛡️','Escudo','m'],
  ['🏹','Arquero','m'],['🧙','Mago','m'],['🧝','Elfo','m'],['🧟','Zombi','m'],
  ['🧛','Vampiro','m'],['💣','Bomba','f'],['🍄','Champiñón','m'],['💰','Tesoro','m'],
  ['🗝️','LlaveAntigua','f'],['🎯','Diana','f'],['🔥','Fénix','m'],['⚔️','Espadachín','m'],
  ['🧱','Bloque','m'],['🤺','Esgrimista','m'],['🐲','Dragoncito','m'],['💠','Gema','f'],
];
const ADJETIVOS = [
  ['Turbo','Turbo'],['Galáctico','Galáctica'],['Cósmico','Cósmica'],['Legendario','Legendaria'],
  ['Cuántico','Cuántica'],['Ninja','Ninja'],['Pixelado','Pixelada'],['Sigiloso','Sigilosa'],
  ['Radiante','Radiante'],['Salvaje','Salvaje'],['Místico','Mística'],['Épico','Épica'],
  ['Supersónico','Supersónica'],['Fantasma','Fantasma'],['Dorado','Dorada'],['Plateado','Plateada'],
  ['Veloz','Veloz'],['Zen','Zen'],['Caótico','Caótica'],['Glacial','Glacial'],
  ['Volcánico','Volcánica'],['Lunar','Lunar'],['Solar','Solar'],['Estelar','Estelar'],
  ['Neón','Neón'],['Retro','Retro'],['Cibernético','Cibernética'],['Mágico','Mágica'],
  ['Sabio','Sabia'],['Travieso','Traviesa'],['Feroz','Feroz'],['Tranquilo','Tranquila'],
  ['Brillante','Brillante'],['Nocturno','Nocturna'],['Eléctrico','Eléctrica'],['Tropical','Tropical'],
  ['Ártico','Ártica'],['Feliz','Feliz'],['Gruñón','Gruñona'],['Dormilón','Dormilona'],
  ['Saltarín','Saltarina'],['Volador','Voladora'],['Invisible','Invisible'],['Millonario','Millonaria'],
  ['Pirata','Pirata'],['Samurái','Samurái'],['Atómico','Atómica'],['Biónico','Biónica'],
  ['Crujiente','Crujiente'],['Deluxe','Deluxe'],['Ultra','Ultra'],['Mega','Mega'],
  ['Hiperactivo','Hiperactiva'],['Ancestral','Ancestral'],['Misterioso','Misteriosa'],['Peludo','Peluda'],
  ['Diminuto','Diminuta'],['Gigante','Gigante'],['Parlanchín','Parlanchina'],['Chiflado','Chiflada'],
  ['Espacial','Espacial'],['Interdimensional','Interdimensional'],
];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function buildNick(){
  const [emoji, nombre, genero] = pick(NOMBRES);
  const adj = pick(ADJETIVOS)[genero === 'f' ? 1 : 0];
  const num = 10 + Math.floor(Math.random() * 990);
  return `${emoji} ${nombre}${adj}${num}`;
}
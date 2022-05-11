// Definisi Library yang digunakan
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const { phoneNumberFormatter } = require("./helpers/formatter");
const express = require("express");
const qrcode = require("qrcode");
const session = require("express-session");
const SocketIO = require("socket.io");
const bodyParser = require("body-parser");
const path = require("path");
const flash = require("req-flash");
const hhtp = require("http");
const Swal = require('sweetalert2');

const app = express();
const server = hhtp.createServer(app);
const io = SocketIO(server);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
  },
  authStrategy: new LocalAuth(),
});

client.on("message", (msg) => {
  if (msg.body == "ping") {
    msg.reply("pong");
  }
});

client.initialize();

// Socket IO
io.on("connection", function (socket) {
  socket.emit("message", "Connecting...");
  console.log("Connecting : " + socket.id);

  client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code received, scan please!");
    });
  });

  client.on("ready", () => {
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
    console.log("Ready");
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "Whatsapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
    console.log("AUTHENTICATED");
  });

  client.on("auth_failure", function (session) {
    socket.emit("message", "Auth failure, restarting...");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", "Whatsapp is disconnected!");
    console.log("disconnected: " + socket.id);
    client.destroy();
    client.initialize();
  });
});

const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
};

// Send message
app.post("/send-message", async (req, res) => {
  // console.log(req.body.number);

  // const number = req.body.number;
  const number = phoneNumberFormatter(req.body.number);
  const message = req.body.message;
  // console.log(number, message);

  //     const isRegisteredNumber = await checkRegisteredNumber(number);

  //   if (!isRegisteredNumber) {
  //     return res.status(422).json({
  //       status: false,
  //       message: 'Maaf Nomor Tidak Terdaftar di Whatapps'
  //     });
  //   }

  client.sendMessage(number, message).then(response => {
    return res.redirect(301, 'http://localhost:5050/send?success=true&message=Logged In Successfully"');
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

// Definisi lokasi file router
const loginRoutes = require("./src/routes/router-login");
const registerRoutes = require("./src/routes/router-register");
const appRoutes = require("./src/routes/router-app");
const { url } = require("inspector");
const { redirect } = require("express/lib/response");

// Configurasi dan gunakan library
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configurasi library session
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: "t@1k0ch3ng",
    name: "secretName",
    cookie: {
      sameSite: true,
      maxAge: 300000 * 30 * 24,
    },
  })
);
app.use(flash());

// tambahkan ini
app.use(function (req, res, next) {
  res.setHeader("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.setHeader("Pragma", "no-cache");
  next();
});
// end

// Setting folder views
app.set("views", path.join(__dirname, "src/views"));
app.set("view engine", "ejs");
//set folder public as static folder for static file
// app.use('/assets',express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, "public")));

// Gunakan routes yang telah didefinisikan
app.use("/login", loginRoutes);
app.use("/register", registerRoutes);
app.use("/", appRoutes);

// Gunakan port server
server.listen(5050, () => {
  console.log("Server Berjalan di Port : " + 5050);
});

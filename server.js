const express = require("express");
const fetch = require("node-fetch-commonjs");

const app = express();

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public"));

const redirect_uri = "http://localhost:1312/callback";
const client_id = "XXXXXX";
const client_secret = "XXXXX";

global.access_token;

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/authorize", (req, res) => {
  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: client_id,
    scope: "user-top-read user-top-read user-read-email user-read-private",
    redirect_uri: redirect_uri,
  });

  res.redirect(
    "https://accounts.spotify.com/authorize?" + auth_query_parameters.toString()
  );
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  var body = new URLSearchParams({
    code: code,
    redirect_uri: redirect_uri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    body: body,
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
  });

  const data = await response.json();
  global.access_token = data.access_token;
  // console.log(data);

  res.redirect("/dashboard");
});

async function getData(endpoint) {
  const response = await fetch("https://api.spotify.com/v1" + endpoint, {
    method: "get",
    headers: {
      Authorization: "Bearer " + global.access_token,
    },
  });

  if (response.status === 200) {
    const data = await response.json();
    return data;
  } else {
    throw new Error("Gagal memuat data. Anda tidak terdaftar dalam Development Dashboard");
  }
}

app.get("/dashboard", async (req, res) => {
  try {
    const userInfo = await getData("/me");
    const tracks = await getData("/me/top/tracks?time_range=short_term&limit=5");

    res.render("dashboard", { user: userInfo, tracks: tracks.items });
  } catch (error) {
    res.status(500).send("<h1 style='color: red;'>Gagal memuat data. Anda tidak terdaftar dalam Development Dashboard</h1>");
  }
});

let listener = app.listen(1312, function () {
  console.log(
    "Your app is listening on http://localhost:" + listener.address().port
  );
});

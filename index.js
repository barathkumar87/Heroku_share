const mongoose = require("mongoose");
const express = require("express");

let app = express();

app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

var url = process.env.MONGOOSE_URI;
mongoose.connect(url, function (err) {
  if (err) throw err;
  console.log("successfully connected");
});

let shareSchema = mongoose.Schema({
  message: String,
  ttl: Number,
  link: String,
  type: String,
  username: String,
});

let userSchema = mongoose.Schema({
  username: String,
  password: String,
  email: String,
});

let share = mongoose.model("share", shareSchema);

let user = mongoose.model("users", userSchema);

// generate random
function generateRand(x) {
  let result = "";
  let availchar = "abcdefghijklmnopqrstuvw0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (i = 0; i < x; i++) {
    result += availchar.charAt(Math.ceil(Math.random() * 62));
  }
  return result;
}

//check if link exists
async function eckIfLinkExist(random) {
  var value = await share.exists({ link: random });
  if (value) {
    return 1;
  } else {
    return 0;
  }
}

async function generateLink() {
  var randiom = generateRand(8);

  await eckIfLinkExist(randiom).then((data) => {
    if (data == 1) {
      generateLink();
    } else {
    }
  });
  return randiom;
}

app.get("/share", function (req, res) {
  res.sendFile("index.html", { root: "./frontend" });
});

// API: postdata
app.post("/postData", async function (req, res) {
  var jsonData = req.body;

  var data = await generateLink();

  // add to db
  var newshare = new share({
    message: jsonData.msg,
    ttl: jsonData.ttl,
    type: jsonData.type,
    link: data,
    username: jsonData.username,
  });

  newshare.save(function (err, kol) {
    if (err) {
      console.log(err);
    } else {
      res.json({ link: data });
    }
  });
});


//api: homepage
app.get("/", function (req, res) {
  res.render("homePage");
});

app.get("/loginPage", function (req, res) {
  res.render("loginPage");
});

app.get("/registerPage", function (req, res) {
  res.render("registerPage");
});

app.post("/register", function (req, res) {
  var jsonData = req.body;

  // add to db
  var newUser = new user({
    username: jsonData.username,
    password: jsonData.password,
    email: jsonData.email,
  });

  newUser.save(function (err, kol) {
    if (err) {
      console.log(err);
    } else {
      res.json({ status: "200" });
    }
  });
});

app.post("/login", function (req, res) {
  var jsonData = req.body;

  user.exists(
    { username: jsonData.username, password: jsonData.password },
    function (err, data) {
      if (data) {
        res.json({ status: "200" });
      } else {
        res.json({ status: "401" });
      }
    }
  );
});

app.get("/dashboard/:username", async function (req, res) {
  await user
    .findOne({ username: req.params.username }, function (err, data) {})
    .then((q) => {
      share
        .find({ username: req.params.username }, function (err, q) {})
        .then((result) => {
         
          console.log(result);
          res.render("dashboard", {
            username: req.params.username,
            result: result,
          });
        });
    });
});

// API :display message
app.get("/:link", function (req, res) {
  var got = eckIfLinkExist(req.params.link).then((data) => {
    if (data) {
     
      share.findOne({ link: req.params.link }, function (err, data) {
        var presentDate = new Date();

        var createdDate = data._id.getTimestamp();

        var seconds = Math.abs((presentDate - createdDate) / 1000);

        console.log(seconds);
        let v = share.findOne(
          { $and: [{ link: req.params.link }, { ttl: { $gte: seconds } }] },
          (err, result) => {
            if (result) {
              if (result.type == "message") {
                res.render("displayMessage", {
                  message: result.message,
                  type: result.type,
                  status: 200,
                  time: result.ttl - seconds,
                });
              } else {
                res.render("displayLink", {
                  message: result.message,
                  type: result.type,
                  status: 200,
                  time: result.ttl - seconds,
                });
              }
            } else {
              console.log("Incorrect URL");
              res.render("pageNotFound");
            }
          }
        );
      });
    } else {
      console.log("Incorrct URL");
      res.render("pageNotFound");
    }
  });
});

// Add headers
app.use(function (req, res, next) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://shareapp-app.herokuapp.com/"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  res.setHeader("Access-Control-Allow-Credentials", true);

  next();
});


app.listen(process.env.PORT || 3000, function () {
  console.log(
    "Express server listening on port %d in %s mode",
    this.address().port,
    app.settings.env
  );
});

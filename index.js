const mongoose = require("mongoose");
const express = require("express");

let app = express();

app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');

var url = process.env.MONGOLAB_URI;
mongoose.connect(url, function (err) {
  if (err) throw err;
  console.log("successfully connected");
});

let shareSchema = mongoose.Schema({
  message: String,
  ttl: Number, 
  link: String,
  type: String,
});

let share = mongoose.model("share", shareSchema);

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


app.get("/", function (req, res) {
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
  });

  newshare.save(function (err, kol) {
    if (err) {
      console.log(err);
    } else {
      res.json({ link: data });
    }
  });
});


// API :display message
app.get("/:link", function (req, res) {
  var got = eckIfLinkExist(req.params.link).then((data) => {
    if (data) {
      console.log("HELO");

      share.findOne({ link: req.params.link }, function (err, data) {
        var presentDate = new Date();

        var createdDate = data._id.getTimestamp();

        var seconds = Math.abs((presentDate - createdDate) / 1000);

        console.log(seconds);
        let v = share.findOne(
          { $and: [{ link: req.params.link }, { ttl: { $gte: seconds } }] },
            (err, result) => {
                if(result){
                    if(result.type == "message"){
                        res.render("displayMessage", {message:result.message, type:result.type, status:200, time:result.ttl-seconds});
                    }
                    else{
                        res.render("displayLink", {message:result.message, type:result.type, status:200, time:result.ttl-seconds});
                    }
                  
                }
                else{
                  console.log("OOPS");
                    res.render("pageNotFound");

                }
          }
        );
      });

    }
    else{
      console.log("OOPS");
        res.render("pageNotFound");

    }
  });
});

// Add headers
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "https://shareapp-app.herokuapp.com/");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

// app.listen(3000, "localhost", () => {
//   console.log("Server is up");
// });

let port_number = server.listen(process.env.PORT || 3000);
app.listen(port_number);

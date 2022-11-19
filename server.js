const express = require("express");
const session = require("express-session");
const app = express();
const mongoose = require("mongoose");
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Mongodb connection url
mongoose.connect("mongodb://localhost:27017/advocate", {
  useNewUrlParser: true,
});

const feedbackSchema = new mongoose.Schema({
  feedback: String,
  user: String,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
});

const feedbackData = mongoose.model("feedbackData", feedbackSchema);
const siteUsers = mongoose.model("siteUsers", userSchema);

app.use((req, res, next) => {
  // if (req.session.email === undefined) {
  //   req.lolcas.name == "Guest";
  //   res.locals.isLoggedIn = false;

  // } else {
  //   res.locals.name = req.session.name;
  //   // res.locals.dp = req.session.dp;
  //   res.locals.email = req.session.email;
  //   // res.locals.phone = req.session.phone;
  //   res.locals.isLoggedIn = true;
  // }

  console.log(req.session);

  next();
});

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/login", (req, res) => {
  res.render("register", { errors: [] });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const errors = [];
  siteUsers.findOne({ email: email }, (err, results) => {
    if (err) {
      console.log(err);
    } else {
      if (results) {
        if (results.password === password) {
          req.session.email = results.email;
          req.session.name = results.name;
          res.redirect("/");
        } else {
          errors.push("Password does not match !");
          res.render("register", { errors: errors });
        }
      }
    }
  });
});

app.post("/register", (req, res) => {
  const { name, password, phone, email } = req.body;

  console.log(req.body);

  const errors = [];

  siteUsers.find({ email: email }, (err, result) => {
    if (result.length > 0) {
      errors.push("Email already exist");
      res.render("register", { errors: errors });
    } else {
      const data = new siteUsers({
        name: name,
        password: password,
        phone: phone,
        email: email,
      });
      data.save((err, result) => {
        if (err) {
          console.log(err);
        } else {
          req.session.name = result.name;
          // req.session.userid = result._id;
          req.session.email = result.email;
          // req.session.phone = result.contactNumber;
          console.log(result);
          res.redirect("/");
        }
      });
    }
  });
});

app.get("/", (req, res) => {
  res.render("homepage");
  // console.log(req.session);
  // console.log('from home page');
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/contact", (req, res) => {
  const { subject, message } = req.body;
  console.log(subject, message);
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/adminLogin", (req, res) => {
  res.render("adminLogin");
});

app.post("/adminLogin", (req, res) => {
  const { username, password } = req.body;
  if (username == "admin" && password == "password") {
    req.session.adminUser = "admin";
    res.redirect("/admin");
  }
});

app.get(
  "/admin",
  (req, res, next) => {
    if (req.session.adminUser == "admin") {
      next();
    } else {
      res.send(
        '<h1>Please Login as a Admin to access the dashboard.</h1>         <a href="/adminLogin">Login</a>'
      );
    }
  },
  (req, res) => {
    res.render("admin");
  }
);

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
});

app.listen(3000, "0.0.0.0", () =>
  console.log(`Server started on port ${port}`)
);

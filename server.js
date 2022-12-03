const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const port = process.env.PORT || 3000;
const app = express();

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
  if (req.session.email === undefined) {
    res.locals.isLoggedIn = false;
  } else {
    res.locals.name = req.session.name;
    // res.locals.dp = req.session.dp;
    res.locals.email = req.session.email;
    // res.locals.phone = req.session.phone;
    res.locals.isLoggedIn = true;
  }

  console.log(req.session);

  next();
});

// Mongodb connection url
mongoose.connect("mongodb+srv://advocate:advocate%401234@cluster0.uo2hy5v.mongodb.net/?retryWrites=true&w=majority", {
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

const enquirySchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  complaint: String,
  subject: String,
  status: Boolean,
});

const feedbackData = mongoose.model("feedbackData", feedbackSchema);
const siteUsers = mongoose.model("siteUsers", userSchema);
const complaintData = mongoose.model("complainData", enquirySchema);

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
        console.log(results);
        if (results.password === password) {
          req.session.email = results.email;
          req.session.name = results.name;
          req.session.phone = results.phone;
          // console.log(req.session);
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
          req.session.phone = result.phone;
          console.log(result);
          res.redirect("/");
        }
      });
    }
  });
});

app.get("/", (req, res) => {
  const msg = [];

  res.render("homepage", { msg: msg });
  // console.log(req.session);
  // console.log('from home page');
});

app.get(
  "/contact",
  (req, res, next) => {
    if (req.session.email) {
      next();
    } else {
      res.send("Please Login to continue" + '<a href="/login"> Login </a>');
    }
  },
  (req, res) => {
    res.render("contact");
  }
);

app.post("/contact", (req, res) => {
  const msg = [];

  const { subject, message } = req.body;
  const data = new complaintData({
    subject: subject,
    complaint: message,
    name: req.session.name,
    email: req.session.email,
    phone: req.session.phone,
    status: true,
  });
  data.save((err, result) => {
    if (err) {
      res.send("something went wrong try again");
    }
  });

  let mailOptions = {
    from: "Advocate",
    to: req.session.email,
    subject: "From Advocate",
    text: `Hi ${req.session.name}, this is team from Advocate, we recieved your enquiry and we will contact you shortly.`,
  };
  nodemailer
    .createTransport({
      service: "Gmail",
      auth: {
        user: "advocatetgeorgejohn01@gmail.com",
        pass: "bpqrxtvwvnhubrli",
      },
      port: 465,
      host: "smtp.gmail.com",
    })
    .sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(info);
      }
    });

  msg.push("Your Enquiry has been registered we will contact you shortly");

  res.render("homepage", { msg: msg });
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
    complaintData.find((err, result) => {
      console.log(result);
      if (!err) {
        res.render("admin", { data: result });
      } else {
        console.log("something went wrong");
      }
    });
  }
);

// Pending Logic

app.get("/deleteAction/:id", (req, res) => {
  const id = req.params.id;
  const filter = { _id: id };
  const update = { status: false };

  complaintData.findByIdAndUpdate(
    filter,
    update,
    { new: true },
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        // console.log(result);
      }
    }
  );
  res.redirect("/admin");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.redirect("/");
    } else {
      res.redirect("/");
    }
  });
});

app.listen(3000, "0.0.0.0", () =>
  console.log(`Server started on port ${port}`)
);

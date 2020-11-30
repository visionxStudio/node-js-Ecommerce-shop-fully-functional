// importing the required modules
const path = require('path');
const chalk = require('chalk');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
// initializing a session storage 
const MongoDBStore = require('connect-mongodb-session')(session);

// importing the csrf validation module
const csrf = require('csurf');

const flash = require('connect-flash');

const errorController = require('./controllers/error');
const User = require('./models/user');

// defining a constant for mongodb
const MONGODB_URI =
  'mongodb+srv://manish:iamvisionx123@test-42wxh.mongodb.net/shop';

// initializing the express
const app = express();

// creating a store for the session which will be stored in the session collection
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

// initialize the csrf token
const csrfProtection = csrf();

// setting up the view engine
app.set('view engine', 'ejs');
// templates and front end folders
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// setting up the body parser for getting the post request data 
app.use(bodyParser.urlencoded({
  extended: false
}));

// setting up the static folders for static documents
app.use(express.static(path.join(__dirname, 'public')));

// initializing the session
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

// use it after initializing the session because the csrf will use the session  so  BE CAREFUL
app.use(csrfProtection);

// initialize this after the inialization of the session
app.use(flash());


app.use((req, res, next) => {
  // after logout req.session.user will not be there so to handle that request it is necessary
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
      console.log(chalk.inverse.red(err))
    });
});
  
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// using the routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.get404);

// connecting to the database
mongoose
  .connect(
    MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, // checking for the errors
    (err) => {
      if (err) {
        console.log(chalk.inverse.red(err));
      } else {
        console.log(chalk.greenBright.inverse.bold("Connected!"));
      }
    })
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
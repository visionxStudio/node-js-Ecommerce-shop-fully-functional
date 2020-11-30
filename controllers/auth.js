// node js has a build in crypto library
const crypto = require('crypto');

const {
  validationResult
} = require('express-validator');

// importing the required modules and other requirements
const User = require('../models/user');

const bcrypt = require('bcryptjs');
// const nodeMailer = require('nodemailer');
// const sendgridTransport = require('nodemailer-sendgrid-transport');

// initializing the transporter
const sgMail = require('@sendgrid/mail');
const user = require('../models/user');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// initializing the transporter
// const transporter = nodeMailer.createTransport(sendgridTransport({
//   auth: {
//     apiKey: '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'
//   }
// }));

// rendering the login page
exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  // if there is no error message then it passes an empty array so we needed to follow this step
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
    // isAuthenticated: false, // passing this argument for rendering the admin stuffs and cart and orders 
    // csrfToken: req.csrfToken() 
  });
};
Date.now()
// rendering the signup page 
exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  // if there is no error message then it passes an empty array so we needed to follow this step
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};
// handeling the login request for a user
exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'ligin',
      errorMessage: errors.array()[0].msg
    })
  }

  User.findOne({
      email: email
    })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email or password.')
        return res.redirect('/login');
      }
      bcrypt
        .compare(password, user.password) // returns true if matched and false if it is not matched
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true; // if login is successful then isLoggedIn will be set to true
            // storing the user in the req.session
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              return res.redirect('/');
            });
          }
          req.flash('error', 'Invalid email or password.')
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        })
    })
    .catch(err => console.log(err));
};

// handeling the post request for the signup
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  // checking for any validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  // encrypting the password
  bcrypt.hash(password, 12)
    .then(hashedPassword => {
      // this will execute only if there is no user with that email address
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: {
          items: []
        }
      });
      return user.save();
    })
    .then(result => {
      res.redirect('/login');
      const msg = {
        to: email,
        from: 'manish.rajak2055@gmail.com',
        subject: 'SignUp Successful!',
        html: '<h1>You successfully signed up!</h1>',
      };
      sgMail.send(msg);
    })
    .catch(err => {
      console.log(err);
    })
};

// handeling the post request for the logout request
exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};


/*
  Resetting the passwords
*/

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  // if there is no error message then it passes an empty array so we needed to follow this step
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Title',
    errorMessage: message
  });
}

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => { // random bytes generates some random bytes and 32 specifies the num of bytes
    if (err) {
      console.log(err);
      res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({
        email: req.body.email
      })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account is associated with that email!');
          res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 300000;
        return user.save()
      })
      .then(result => {
        res.redirect('/');
        const msg = {
          to: req.body.email,
          from: 'manish.rajak2055@gmail.com',
          subject: 'Password Reset',
          html: `
            <p>You requested a password reset</p>
            <p><strong>Click the link below to Reset your Password</strong></p>
            <p><a href="http://localhost:3000/reset/${token}">CLICK HERE!</p>
          `
        };
        sgMail.send(msg);
      })
      .catch(err => {
        console.log(err);
      });
  })
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  user.findOne({
      resetToken: token,
      resetTokenExpiration: {
        $gt: Date.now() // here gt stands for greater than 
      }
    })
    .then(user => {
      let message = req.flash('error');
      // if there is no error message then it passes an empty array so we needed to follow this step
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser; // storing the user session in this because it won't be stored.
  User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: {
        $gt: Date.now()
      },
      _id: userId
    })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12)
        .then(hashedPassword => {
          resetUser.password = hashedPassword;
          resetUser.resetToken = undefined;
          resetUser.resetTokenExpiration = undefined;
          return resetUser.save();
        })
        .then(result => {
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
        })
    })
    .catch(err => {
      console.log(err)
    })
};
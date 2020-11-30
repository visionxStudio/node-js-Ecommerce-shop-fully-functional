// handeling the login request for a user
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({
        email: email
      })
      .then(user => {
        if (!user) {
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
            res.redirect('/login');
          })
          .catch(err => {
            console.log(err);
            res.redirect('/login');
          })
      })
      .catch(err => console.log(err));
  };
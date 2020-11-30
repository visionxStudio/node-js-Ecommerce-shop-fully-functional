
// checking if the user is logged in or not and controlling the routes

module.exports = (req, res, next) => {
    if(!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
}



/* 
So what is the fullform of CSRF ? 
    CSRF => cross Site Request Forgery
*/ 
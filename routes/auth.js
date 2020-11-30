const express = require('express');
const {
    check,
    body
} = require('express-validator');

const User = require('../models/user');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

router.post('/signup',
    [
        check('email')
        .isEmail()
        .withMessage('Please Enter a Valid Email')
        .custom((value, {
            req
        }) => {
            // checking if the user with the same email exists or not and then creating a new user
            return User.findOne({
                    email: value
                })
                .then(userDoc => {
                    // checking if the user with that email already exists or not
                    if (userDoc) {
                        return Promise.reject('The account with this email already exists!');
                        // if the promise rejects then express-validator will automatically store it as an error msg
                    }
                })
            }),
        body('password', 'Please enter a valid password of length in between 6 to 32 characters')
        .isLength({
            min: 6,
            max: 32
        }),
        body('confirmPassword').custom((value, {
            req
        }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match!')
            }
            return true;
        })
    ], authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
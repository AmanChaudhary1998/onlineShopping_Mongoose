const express = require('express')
const { check, body } = require('express-validator/check');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup',authController.getSignup);

router.post('/login',
[
    check('email').isEmail().withMessage("Please enter the valid email!").normalizeEmail(),
    body('password','Enter password contain only number and text and atleast of 6 characters ').isLength({min: 6}).isAlphanumeric().trim()
],
authController.postLogin);

router.post('/signup', 
[
    // Apply validation here
    check('email').isEmail().withMessage('Please enter the valid email').normalizeEmail(),
    body('password', 'Please enter password contain only number and text and atleast of 6 characters').isLength({min: 6}).isAlphanumeric().trim(),
    body('confirmPassword').trim().custom((value, {req})=>{
        if(value !== req.body.password)
        {
            throw Error('Password and Confirm password not match');
        }
        return true;
    })
]  ,authController.postSignup);

router.get('/reset', authController.getReset);

router.post('/reset',authController.postReset);

router.post('/logout', authController.postLogout);

module.exports = router
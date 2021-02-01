const bcrypt = require('bcryptjs');
const crypto = require('crypto'); 
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator')
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth:{
    api_key: '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'
  }
}))

exports.getLogin = (req,res,next)=>{
    //const isLoggedIn = req.get('Cookie').split('=')[1] === 'true';
    let message = req.flash('error');
    if(message.length>0)
    {
      message =  message[0];
    }
    else {
      message = null
    }
    res.render('auth/login', {
        path:'/login',
        pageTitle:'Login',
        isAuthenticated: false,
        errorMessage: message
    });
}

exports.getSignup = (req,res,next) =>{
  let message = req.flash('error')
  if(message.length>0)
  {
    message = message[0];
  }
  else{
    message = null;
  }
  res.render('auth/signup',{
    path:'/signup',
    pageTitle:'Signup',
    errorMessage: message,
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.postLogin = (req,res,next) =>{
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    return res.status(422).render('auth/login',{
      path:'/login',
      pageTitle:'Login',
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg
    })
  }
    User.findOne({email:email})
    .then((user)=>{
      console.log(user);
      if(!user)
      {
        req.flash('error','Invalid email or password');
        return res.redirect('/login');
      }
      bcrypt.compare(password,user.password)
      .then((match)=>{
        if(match)
        {
          //res.setHeader('Set-Cookie','loggedIn=true');
          req.session.isLoggedIn = true;
          req.session.user = user;  
          return req.session.save((err)=>{
          console.log(err);
          res.redirect('/');
        });
      }
      req.flash('error','Invalid email or password');
      res.redirect('/login');
      })
      .catch((err)=>{
        console.log(err);
        res.redirect('/login');
      })
    })
}

exports.postSignup = (req,res,next)=>{
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    console.log(errors.array())
    return res.status(422).render('auth/signup',{
      path:'/signup',
      pageTitle:'Signup',
      errorMessage: errors.array()[0].msg,
      isAuthenticated:req.session.isLoggedIn
    });
  }
  User.findOne({email:email})
  .then((userDoc)=>{
    if(userDoc)
    {
      req.flash('error','user already exists');
      return res.redirect('/signup');
    }
    return bcrypt.hash(password,12)
    .then((hashedPassword)=>{
      const user = new User({
        email:email,
        password:hashedPassword,
        cart: {items:[]}
      });
      return user.save()
    })
    .then(()=>{
      res.redirect('/login');
      return transporter.sendMail({
        to: email,
        from: 'apnabazzar@shopnow.com',
        subject: 'Signup Succeed',
        html:'<h1>You successfully signed up....</h1>'
      })
    })
    .catch((err) =>{
      console.log(err);
    });
  })
  .catch((err)=>{
    console.log(err);
  })
}

exports.postLogout = (req,res,next) =>{
    req.session.destroy((err)=>{
        console.log(err);
        res.redirect('/');
    });
}

exports.getReset = (req,res,next) =>{
  let message = req.flash('error');
    if(message.length>0)
    {
      message =  message[0];
    }
    else {
      message = null
    }
  res.render('auth/reset', {
    path:'/reset',
    pageTitle:'Reset',
    errorMessage: message,
    isAuthenticated: req.session.isLoggedIn
  });
}

exports.postReset = (req,res,next)=>{
  crypto.randomBytes(32,(err,buffer)=>{
    if(err)
    {
      console.log(err);
      return res.redirect('/');
    }
    const token = buffer.toString('hex');
    User.findOne({email: req.body.email})
    .then((user) =>{
      if(!user)
      {
        req.flash('error','Invalid Email');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      return user.save();
    })
    .then(()=>{
      res.redirect('/');
      transporter.sendMail({
        to: req.body.email,
        from: 'apnabazzar.com',
        subject: 'Reset Password ',
        html: `
        <p>You requested for reset the password</p>
        <p>Click these <a href="http://localhost:3000/reset/${token}">link</a>to set new password</p>
        `
      });
    })
    .catch((err)=>{
      console.log(err);
    })
  })
}
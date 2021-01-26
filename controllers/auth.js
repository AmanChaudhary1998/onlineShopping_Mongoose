const User = require('../models/user');

exports.getLogin = (req,res,next)=>{
    //const isLoggedIn = req.get('Cookie').split('=')[1] === 'true';
    console.log(req.session.isLoggedIn);
    res.render('auth/login', {
        path:'/login',
        pageTitle:'Login',
        isAuthenticated: false
    });
}

exports.postLogin = (req,res,next) =>{
    User.findById("600accb5d17b1d376cdd617a")
  .then((user)=>{
    //res.setHeader('Set-Cookie','loggedIn=true');
    req.session.isLoggedIn = true;
    req.session.user = user;
    req.session.save((err)=>{
      console.log(err);
      res.redirect('/');
    })
    res.redirect('/');
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
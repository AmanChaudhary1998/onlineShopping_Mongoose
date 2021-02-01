const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const MongoDBStore = require('connect-mongodb-session')(session);

const MONGODB_URI = 'mongodb+srv://aman001:aman28@mycluster.o3hq5.mongodb.net/shop';

const User = require('./models/user');

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination : (req,file,cb)=>{
    cb(null,'images');
  },
  filename: (req,file,cb) =>{
    cb(null, new Date().toISOString().replace(/[\/\\:]/g, "_") + file.originalname)
  }
});

const fileFilter = (req,file,cb) =>{
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg')
  {
    cb(null,true);
  }
  else{
    cb(null,false)
  }
}

const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRouter = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage:fileStorage, fileFilter:fileFilter}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));

app.use(session({secret:'my secret', resave: false, saveUninitialized: false, store:store}))

app.use(csrfProtection);
app.use(flash());

app.use((req,res,next) =>{
  if(!req.session.user)
  {
    return next();
  }
  User.findById(req.session.user._id)
  .then((user)=>{
    req.user = user;
    next();
  })
  .catch((err)=>{
    console.log(err);
  })
});

app.use((req,res,next)=>{
  res.locals.isAuthenticted = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use('/admin', adminRoutes);
app.use('/',shopRoutes);
app.use(authRouter);

app.use((req, res, next) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found', path: '404' });
});

mongoose.connect(MONGODB_URI)
.then(()=>{
  console.log('Connected successfully...');
  app.listen(3000);
})
.catch((err)=>{
  console.log(err);
})


// app.listen(PORT,()=>{
//   console.log(`Server is connected at http://localhost:${PORT}`)
// });


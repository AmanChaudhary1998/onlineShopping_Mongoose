const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const User = require('./models/user');

const app = express();

const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const user = require('./models/user');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req,res,next)=>{
  User.findById("600accb5d17b1d376cdd617a")
  .then((user)=>{
    req.user = user;
    next();
  })
  .catch((err)=>{
    console.log(err);
  })
})

app.use('/admin', adminRoutes);
app.use('/',shopRoutes);

app.use((req, res, next) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found', path: '404' });
});

mongoose.connect('mongodb+srv://aman001:aman28@mycluster.o3hq5.mongodb.net/shop?retryWrites=true&w=majority')
.then(()=>{
  User.findOne().then((user)=>{
    if(!user)
    {
      const user = new User({
        name:'Aman',
        email: 'aman28111998@gmail.com',
        cart: {
          items:[]
        }
      });
      user.save();
    }
  })
  console.log('Connected successfully...');
  app.listen(3000);
})
.catch((err)=>{
  console.log(err);
})


// app.listen(PORT,()=>{
//   console.log(`Server is connected at http://localhost:${PORT}`)
// });


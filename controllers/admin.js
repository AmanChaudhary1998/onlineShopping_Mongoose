const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if(!image)
  {
    return res.redirect('/admin/add-products');
  }
  const imageUrl = image.path;
  const product = new Product({
    title:title,
    price:price,
    description:description,
    imageUrl:imageUrl,
    userId: req.user
  });
  product.save()
  .then((result)=>{
    console.log(result);
    res.redirect('/admin/products');
  }).catch((err)=>{
    console.log(err)
  });
};

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
  .populate('userId')
  .then((products)=>{
    console.log(products);
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
      isAuthenticated:req.session.isLoggedIn
      });
  })
  .catch((err)=>{
    console.log(err);
  })
};


exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  console.log(editMode);
  if(!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
  .then((product)=>{
    if(!product) {
      return res.render('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product:product,
      isAuthenticated:req.session.isLoggedIn
    });
  })
  .catch((err)=>{
    console.log(err);
  });
};

exports.postEditProduct = (req,res,next)=>{
  const prodId = req.body.productId;
  const updatetitle = req.body.title;
  const updateimage = req.file;
  const updateprice = req.body.price;
  const updatedescription = req.body.description;

  Product.findById(prodId).then( product => {
    if(product.userId.toString() !== req.user._id.toString())
  {
    return res.redirect('/');
  }
    product.title = updatetitle;
    product.price = updateprice;
    product.description = updatedescription;
    if(updateimage)
    {
      product.imageUrl = updateimage.path; 
    }
    return product.save()
    .then((result)=>{
      console.log('UPDATED PRODUCT SUCCESSFULLY!!!');
      res.redirect('/admin/products');
    })
  })
  .catch((err)=>{
    console.log(err);
  })
}

exports.postDeleteProduct = (req,res,next)=>{
  const prodId = req.body.productId;
  console.log(prodId);
  Product.deleteOne({_id: prodId,userId: req.user._id})
  .then((product)=>{
    console.log(product);
    res.redirect('/admin/products');
  })
  .catch((err)=>{
    console.log(err);
  })
}

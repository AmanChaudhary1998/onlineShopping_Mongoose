const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find().countDocuments().then((numProducts)=>{
    totalItems = numProducts;
    return Product.find()
    .skip((page - 1)* ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
  })
  .then((products)=>{
    //console.log(products);
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
      isAuthenticated: req.session.isLoggedIn,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE*page < totalItems,
      hasPreviousPage: page>1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)
    });
  })
  .catch((err)=>{
    console.log(err)
  });
  // Product.find()
  // .then((product)=>{
  //   //console.log(product);
  //   res.render('shop/product-list', {
  //     prods: product,
  //     pageTitle: 'All Products',
  //     path: '/products',
  //     isAuthenticated: req.session.isLoggedIn
  //   });
  // })
  // .catch((err)=>{
  //   console.log(err);
  // })
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
  .then((product)=>{
    console.log(product);
    res.render('shop/product-detail',{
      product:product,
      pageTitle:product.title,
      path:'/products',
      isAuthenticated: req.session.isLoggedIn
    });
  })
  .catch((err)=>{
    console.log(err);
  })
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find().countDocuments().then((numProducts)=>{
    totalItems = numProducts;
    return Product.find()
    .skip((page - 1)* ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
  })
  .then((products)=>{
    //console.log(products);
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      isAuthenticated: req.session.isLoggedIn,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE*page < totalItems,
      hasPreviousPage: page>1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)
    });
  })
  .catch((err)=>{
    console.log(err)
  });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user)=>{
      const products = user.cart.items;
      res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products,
      isAuthenticated:req.session.isLoggedIn
        });
    })
    .catch((err)=>{
      console.log(err);
    })
};

exports.postCart = (req,res,next)=>{
  const prodId = req.body.productId;
  Product.findById(prodId)
  .then((product)=>{
    return req.user.addToCart(product);
  })
  .then((result)=>{
    console.log(result);
    res.redirect('/cart');
  })
  .catch((err)=>{
    console.log(err);
  })
}

exports.postCartDeleteProduct = (req,res,next) =>{
  const prodId = req.body.productId;
  req.user.removeFromCart(prodId)
  .then((result)=>{
    res.redirect('/cart');
  })
  .catch((err)=>{
    console.log(err)
  })
}

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId':req.user._id})
  .then((orders)=>{
    console.log(orders);
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders:orders,
      isAuthenticated:req.session.isLoggedIn
    });
  })
  .catch((err)=>{
    console.log(err);
  })
};

exports.postOrder = (req,res,next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user)=>{
      const products = user.cart.items.map((i)=>{
        return {quantity: i.quantity, product: {...i.productId._doc}}
      });
  const order = new Order({
    user :{
      email:req.user.email,
      userId:req.user
    },
    products: products
  });
  return order.save();
  })
  .then(()=>{
    req.user.clearCart();
  })
  .then(()=>{
    res.redirect('/orders');
  })
  .catch((err)=>{
    console.log(err);
  })
}

// exports.getCheckout = (req, res, next) => {
//   res.render('shop/checkout', {
//     path: '/checkout',
//     pageTitle: 'Checkout'
//   });
// };

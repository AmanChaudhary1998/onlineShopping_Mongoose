const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

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

exports.getInvoice = (req,res,next) =>{
  const orderId = req.params.orderId;
  Order.findById(orderId)
  .then((order)=>{
    if(!order)
    {
      return next(new Error('No order found'));
    }
    if(order.user.userId.toString() !== req.user._id.toString())
    {
      return next(new Error('UnAuthorized Access'));
    }
    const invoiceName = 'invoice-'+ orderId+ '.pdf';
    const invoicepath = path.join('data','invoices', invoiceName);
    const pdfDoc = new PDFDocument();
    
    pdfDoc.pipe(fs.createWriteStream(invoicepath))
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text("Invoice",{
      underline:true
    });
    pdfDoc.text('--------------------------');
    let totalPrice = 0;
    order.products.forEach((prod)=>{
      totalPrice = totalPrice + prod.product.price*prod.quantity;
      pdfDoc.fontSize(16).text('product name '+prod.product.title + '--> ' + 'quantity '+ prod.quantity + ' Amount Rs ' + prod.product.price);
    });
    pdfDoc.text('-----------------------');
    pdfDoc.fontSize(20).text('Total price        ' + totalPrice);
    pdfDoc.end();
    // Work fine with small size files
    // fs.readFile(invoicepath, (err,data)=>{
    //   if(err)
    //   {
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type','application/json');
    //   res.setHeader('Content-Disposition','inline; filename="' + invoiceName + '"')
    //   res.send(data);
    // });

    // Work fine with big size file also
    // const file = fs.createReadStream(invoicepath);
    // res.setHeader('Content-Type','aplication/pdf');
    // res.setHeader('Content-Disposition','inline; filename="'+ invoiceName + '"');
    // file.pipe(res);
  })
  .catch((err)=>{
    console.log(err);
  })
}

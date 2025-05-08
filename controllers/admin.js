const { validationResult } = require("express-validator");

const fileHelper = require('../util/file');

const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {pageTitle: 'Add Product', path:'/admin/add-product', editing: false, hasError: false, isAuthenticated: req.session.isLoggedIn, errorMessage: null, validationErrors: []});
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product', 
            path:'/admin/products', 
            editing: false,
            product: {
                title: title,
                price: price,
                description: description,
            },
            hasError: true,
            errorMessage: 'Attached file is not an image.',
            isAuthenticated: req.session.isLoggedIn
        });
    }
    const imageUrl = image.path;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product', 
            path:'/admin/products', 
            editing: false,
            product: {
                title: title,
                price: price,
                description: description,
            },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            isAuthenticated: req.session.isLoggedIn
        });
    }
    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user
    });
    product
        .save()
        .then(() => {
            console.log('Created Product');
            res.redirect('/');
        })
        .catch(err => {
            // return res.status(500).render('admin/edit-product', {
            //     pageTitle: 'Add Product', 
            //     path:'/admin/products', 
            //     editing: false,
            //     product: {
            //         title: title,
            //         price: price,
            //         description: description,
            //         imageUrl: imageUrl
            //     },
            //     hasError: true,
            //     errorMessage: 'Database operation failed, please try again',
            //     isAuthenticated: req.session.isLoggedIn
            // });
            // return res.redirect('/500');
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getProducts = (req, res, next) => {
    Product.find({userId: req.user._id})
        .then(products => {
            res.render('admin/products', {
                pageTitle: 'Admin Products', 
                prods: products, 
                path: '/admin/products',
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product', 
                path:'/admin/products', 
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                isAuthenticated: req.session.isLoggedIn,
                validationErrors: []
            });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDescription = req.body.description;

    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product', 
            path:'/admin/products', 
            editing: true,
            product: {
                _id: prodId,
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription
            },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            isAuthenticated: req.session.isLoggedIn
        });
    }
    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;
            return product.save().then(() => res.redirect('/admin/products'));      
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    
}

exports.deleteProduct = (req, res, next) => {
    const productId = req.params.productId;
    Product.findById(productId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found.'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({_id: productId, userId: req.user._id});
        })
        .then(() => {
            res.status(200).json({message: 'Success!'});
        })
        .catch(err => {
            res.status(500).json({message: 'Deleting product failed.'});
        });
}
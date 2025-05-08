const express = require('express');
const {check} = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();



router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/products', adminController.getProducts);

router.post('/add-product', 
    [
        check('title')
            .isString()
            .isLength({min:3})
            .trim(),
        check('price')
            .isFloat(),
        check('description')
            .isLength({min:5, max: 400})
            .trim() 
    ] ,
    adminController.postAddProduct);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post('/edit-product', 
    [
        check('title')
            .isString()
            .isLength({min:3})
            .trim(),
        check('price')
            .isFloat(),
        check('description')
            .isLength({min:5, max: 400})
            .trim() 
    ] ,
    adminController.postEditProduct);

router.post('/delete-product', adminController.postDeleteProduct);

module.exports = router;
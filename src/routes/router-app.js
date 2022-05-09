const router = require('express').Router();
const homeController = require('../controllers').home;
const profileController = require('../controllers').profile;
const sendcontroller = require('../controllers').send;
const settingcontroller = require('../controllers').setting;
const verifyUser = require('../configs/verify');

router.get('/', verifyUser.isLogin, homeController.home);
router.get('/profile', verifyUser.isLogin, profileController.profile);
router.get('/send', verifyUser.isLogin, sendcontroller.send);
router.get('/setting', verifyUser.isLogin, settingcontroller.setting);

module.exports = router;
const router = require('express').Router()

const authCtrl = require('../controllers/auth')
const userCtrl = require('../controllers/user')

router.put('/updatescore', authCtrl.authorise, userCtrl.updateScore)

module.exports = router
const router = require('express').Router()

const authCtrl = require('../controllers/auth')
const userCtrl = require('../controllers/user')

router.put('/updatescore', authCtrl.authorise, userCtrl.updateScore)
router.get('/leaderboard', authCtrl.authorise, userCtrl.getLeaderboard)
router.get('/public/leaderboard', userCtrl.getPublicLeaderboard)

module.exports = router
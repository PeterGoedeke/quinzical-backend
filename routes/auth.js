const router = require('express').Router()

const authCtrl = require('../controllers/auth')

router.post('/login', authCtrl.login)
router.post('/register', authCtrl.register)
router.post('/test', authCtrl.authorise, (req, res) => {
    return res.status(200).json({ message: 'worked' })
})

module.exports = router
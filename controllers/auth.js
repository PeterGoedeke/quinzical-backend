const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const validate = require('./validate')
const User = require('mongoose').model('User')

async function register(req, res) {
    const val = validate.isRegistration(req.body)
    if(!val.success) {
        console.log(val.error.details[0].message)
        return res.status(400).json({ message: val.error.details[0].message })
    }

    const usernameInUse = await User.findOne({ username: req.body.username })
    if(usernameInUse) return res.status(400).json({ message: 'Username already exists.' })

    const salt = await bcrypt.genSalt(10) // most likely too low for production
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    const user = new User({
        username: req.body.username,
        password: hashedPassword,
    })
    try {
        await user.save()
        const token = jwt.sign({ _id: user._id, username: req.body.username }, process.env.TOKEN_SECRET)
        return res.header('auth-token', token).send()
    }
    catch (err) {
        console.log(err)
        return res.status(400).json(err)
    }
}

async function login(req, res) {
    const { error } = validate.isLogin(req.body)
    if(error) return res.status(400).json({ message: error.details[0].message}) //Changed format of response so it can be handled on the frontend

    const user = await User.findOne({ username: req.body.username })
    if(!user) return res.status(400).json({ message: 'Username or password incorrect.' })

    const isValidPassword = await bcrypt.compare(req.body.password, user.password)
    if(!isValidPassword) return res.status(400).json({ message: 'Username or password incorrect.' })

    const token = jwt.sign({ _id: user._id, username: req.body.username }, process.env.TOKEN_SECRET)
    return res.header('auth-token', token).json({
        score: user.score,
        coins: user.coins,
    })
}

async function authorise(req, res, next) {
    const token = req.header('auth-token')
    if(!token) return res.status(401).json({ message: 'Access denied; no token provided.' })

    try {
        const authorised = jwt.verify(token, process.env.TOKEN_SECRET)
        req.payload = authorised
        next()
    }
    catch (err) {
        return res.status(400).json({ message: 'Access denied; invalid token.' })
    }
}

module.exports = {
    register,
    login,
    authorise
}
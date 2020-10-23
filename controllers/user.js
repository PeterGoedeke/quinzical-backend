const User = require('mongoose').model('User')

async function updateScore(req, res) {
    const user = await User.findById(req.payload._id)
    if (!user) {
        return res.status(404).json({ message: 'Could not find user' })
    }
    user.score = req.body.score
    await user.save()
    return res.status(200).json({ message: 'Success' }) 
}

async function getLeaderboard(req, res) {
    const users = await User.find({})

    if (!users) {
        return res.status(404).json({ message: 'Users not found' })
    }

    users.sort((a, b) => {
        if (a.score < b.score) {
            return -1
        }
        else if (a.score > b.score) {
            return 1
        }
        return 0
    })
    return res.status(200).json({
        leaderboard: users.slice(0, 10),
        yourPlace: users.map(user => user._id).indexOf(req.payload._id)
    })
}

module.exports = {
    updateScore,
    getLeaderboard
}
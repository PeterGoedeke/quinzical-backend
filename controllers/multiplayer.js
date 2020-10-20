const lobbies = {}

const random = (min, max) => Math.floor(Math.random() * (max - min) ) + min

function getNewLobbyCode() {
    const code = random(1000, 10000)
    return lobbies[code] ? getNewLobbyCode : code
}

function getMember(lobby, _id) {
    for (const member of lobby.members) {
        if (member._id == _id) {
            return member
        }
    }
    return null
}

function messageLobby(id, type, content) {
    for(const client of wsInstance.getWss().clients) {
        if (!getMember(lobbies[id], client.jwt._id)) {
            continue
        }
        client.send(JSON.stringify({
            type,
            ...content
        }))
    }
}
function messageMember(id, type, content) {

}

function isCorrect(answer, lobby) {
    if (answer == lobby.currentQuestion) {
        return true
    }
    return false
}

function onMessage(message, ws) {
    console.log(message)
    const code = message.code
    if (message.type == 'ANSWER') {
        const lobby = lobbies[code]
        const result = isCorrect(message.answer, lobby)

        const scoreIncrease = result ? 100 : 0
        const member = getMember(lobby, ws.jwt._id)
        member.score += scoreIncrease

        ws.send(JSON.stringify({
            type: 'RESULT',
            answerIsCorrect: result,
            score: member.score
        }))
    }
    else if (message.type == 'CREATE_LOBBY') {
        console.log('ayy')
        const questions = message.questions
        console.log(ws.jwt)
        const code = getNewLobbyCode()
        const lobby = {
            host: ws.jwt.username,
            questions,
            code,
            members: [{
                _id: ws.jwt._id,
                score: 0,
                avatar: message.avatar
            }]
        }
        lobbies[code] = lobby
        ws.send(JSON.stringify({
            type: 'LOBBY_ID',
            content: lobby.code
        }))
    }
    else if (message.type == 'NEXT_QUESTION') {
        const lobby = lobbies[code]
        if (lobby.host == ws.jwt.username) {
            lobby.currentQuestion = lobby.questions.pop()

            if (lobby.currentQuestion) {
                ws.send(JSON.stringify({
                    type: 'NEXT_QUESTION',
                    content: lobby.currentQuestion
                }))
            }
            else {
                ws.send(JSON.stringify({
                    type: 'GAME_OVER',
                    content: lobby
                }))
            }
        }
        else {
            console.log('nope')
        }
        // lobby.currentInterval = setInterval(() => {
            
        // }, 30000)
    }
    else if (message.type == 'JOIN_LOBBY') {
        const lobby = lobbies[code]
        if (!lobby) {
            ws.send(JSON.stringify({
                type: "ERROR",
                content: "Invalid lobby"
            }))
            return
        }
        if (!getMember(lobby, ws.jwt._id)) {
            lobby.members.push({
                _id: ws.jwt._id,
                score: 0,
                avatar: message.avatar
            })
            ws.send(JSON.stringify({
                lobby
            }))
        }
    }
    else if (message.type == 'LEAVE_LOBBY') {
        const lobby = lobbies[code]
        lobby.members = lobby.members.splice(lobby.members.indexOf(getMember(lobby, ws.jwt._id)))
        messageLobby(code, 'LEFT', ws.jwt.username)
    }

    console.log(lobbies)
}

module.exports = {
    onMessage
}
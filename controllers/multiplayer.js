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

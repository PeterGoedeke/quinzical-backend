module.exports = function(io) {
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
        for(const socket of io.sockets.sockets) {
            if (!getMember(lobbies[id], socket.jwt._id)) {
                continue
            }
            socket.emit(type, JSON.stringify(content))
        }
    }
    
    /**
     * 
     * @param {SocketIO.Socket} socket 
     */
    function handle(socket) {
        socket.on('RESULT', data => {
            const code = data.code
            const lobby = lobbies[code]
    
            const member = getMember(lobby, socket.jwt._id)
            member.score = data.score
            lobby.membersAnswered ++
            if (lobby.membersAnswered == lobby.members.length) {
                socket.emit('ROUND_OVER', JSON.stringify(lobby.members))
            }
        })
        socket.on('CREATE_LOBBY', data => {
            const questions = data.questions
            const code = getNewLobbyCode()
            const lobby = {
                host: socket.jwt.username,
                questions,
                code,
                members: [{
                    _id: socket.jwt._id,
                    score: 0,
                    avatar: data.avatar
                }]
            }
            lobbies[code] = lobby
            console.log(lobby.code)
            socket.emit('LOBBY_ID', JSON.stringify({ code: lobby.code }))
        })
        socket.on('NEXT_QUESTION', data => {
            const code = data.code
            const lobby = lobbies[code]
            if (lobby.host == socket.jwt.username) {
                lobby.currentQuestion = lobby.questions.pop()
                lobby.membersAnswered = 0
    
                if (lobby.currentQuestion) {
                    socket.emit('NEXT_QUESTION', JSON.stringify(lobby.currentQuestion))
                }
                else {
                    socket.emit('GAME_OVER', JSON.stringify(lobby))
                }
            }
            else {
                console.log('nope')
            }
        })
        socket.on('JOIN_LOBBY', data => {
            const code = data.code
            const lobby = lobbies[code]
            if (!lobby) {
                socket.emit('INVALID_LOBBY', JSON.stringify('Invalid lobby'))
                return
            }
            if (!getMember(lobby, socket.jwt._id)) {
                lobby.members.push({
                    _id: socket.jwt._id,
                    score: 0,
                    avatar: data.avatar
                })
                socket.emit('LOBBY_JOINED', JSON.stringify(lobby))
            }
        })
        socket.on('LEAVE_LOBBY', data => {
            const code = data.code
            const lobby = lobbies[code]
            lobby.members = lobby.members.splice(lobby.members.indexOf(getMember(lobby, socket.jwt._id)))
            messageLobby(code, 'LEFT', socket.jwt.username)
        })
    }
    
    return {
        handle
    }
}

module.exports = function(io) {
    const lobbies = {}
    
    const random = (min, max) => Math.floor(Math.random() * (max - min) ) + min
    
    function getNewLobbyCode() {
        const code = random(10000, 100000)
        return lobbies[code] ? getNewLobbyCode : code
    }
    
    function getMember(lobby, username) {
        for (const member of lobby.members) {
            if (member.username == username) {
                return member
            }
        }
        return null
    }
    
    function messageLobby(code, type, content) {
        for(const socket of io.sockets.sockets) {
            if (!getMember(lobbies[code], socket.jwt.username)) {
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
            console.log('received result message');
            const code = data.code
            const lobby = lobbies[code]
    
            console.log(lobby.members, socket.jwt.username);
            const member = getMember(lobby, socket.jwt.username)
            member.score = data.score
            lobby.membersAnswered ++
            if (lobby.membersAnswered == lobby.members.length) {
                console.log('emitting round over message');
                messageLobby(code, 'ROUND_OVER', JSON.stringify(lobby.members))
            }
        })
        socket.on('CREATE_LOBBY', data => {
            const questions = data.questions
            const code = getNewLobbyCode()
            const lobby = {
                host: socket.jwt.username,
                questions,
                code,
                members: [data.user]
            }
            lobbies[code] = lobby
            console.log('HOSTED: ', lobby.code, lobby.members)
            socket.emit('LOBBY_ID', JSON.stringify({ code: lobby.code }))
        })
        socket.on('NEXT_QUESTION', data => {
            console.log('received next question request');
            const code = data.code
            const lobby = lobbies[code]
            if (lobby.host == socket.jwt.username) {
                lobby.currentQuestion = lobby.questions.pop()
                lobby.membersAnswered = 0
    
                if (lobby.currentQuestion) {
                    console.log('emitting next question');
                    messageLobby(code, 'NEXT_QUESTION', JSON.stringify(lobby.currentQuestion))
                }
                else {
                    console.log('emitting game over');
                    messageLobby(code, 'GAME_OVER', JSON.stringify(lobby))
                }
            }
            else {
                console.log('nope')
            }
        })
        socket.on('JOIN_LOBBY', data => {
            console.log(data)
            const code = Number(data.code)
            const lobby = lobbies[code]
            if (!lobby) {
                socket.emit('INVALID_LOBBY', null)
                return
            }
            // if (!getMember(lobby, socket.jwt._id)) {
                lobby.members.push(data.user)
                console.log('JOINED: ', code, lobby.members)
                // console.log(JSON.stringify(lobby, null, 4));
                messageLobby(code, 'LOBBY_JOINED', JSON.stringify(lobby))
            // }
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

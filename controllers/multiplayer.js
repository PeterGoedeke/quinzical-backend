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
        for(const socketId in io.sockets.sockets) {
            const socket = io.sockets.sockets[socketId]
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
            member.status = data.status
            member.answer = data.answer
            console.log('new score is: ', data.score)
            lobby.membersAnswered ++

            messageLobby(code, 'SCORE_UPDATE', {
                username: socket.jwt.username,
                score: data.score,
                status: data.status,
                answer: data.answer
            })

            if (lobby.membersAnswered == lobby.members.length) {
                console.log('emitting round over message');
                messageLobby(code, 'ROUND_OVER', null)
            }
        })
        socket.on('CREATE_LOBBY', data => {
            const questions = data.questions
            const code = getNewLobbyCode()
            const lobby = {
                host: socket.jwt.username,
                questions,
                code,
                members: [data.user],
                questionsAnswered: 0,
                limit: -1
            }
            lobbies[code] = lobby
            console.log('HOSTED: ', lobby.code, lobby.members)
            socket.emit('LOBBY_ID', JSON.stringify({ code: lobby.code }))
        })
        socket.on('SET_LIMIT', data => {
            const code = data.code
            const lobby = lobbies[code]
            if (socket.jwt.username == lobby.host) {
                lobby.limit = data.limit
                console.log('set limit to ' + data.limit);
            }
        })
        socket.on('NEXT_QUESTION', data => {
            console.log('received next question request');
            const code = data.code
            const lobby = lobbies[code]
            if (lobby.host == socket.jwt.username) {
                lobby.currentQuestion = lobby.questions.pop()
                lobby.questionsAnswered ++
                lobby.membersAnswered = 0
    
                lobby.members.forEach(member => {
                    member.answer = '...'
                    member.status = 'ANSWERING'
                })
                if (lobby.currentQuestion && (lobby.limit == -1 || lobby.questionsAnswered < lobby.limit)) {
                    console.log('emitting next question');
                    messageLobby(code, 'NEXT_QUESTION', {
                        question: lobby.currentQuestion,
                        members: lobby.members
                    })
                }
                else {
                    console.log('emitting game over');
                    messageLobby(code, 'GAME_OVER', lobby)
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
            if (!getMember(lobby, socket.jwt.username)) {
                lobby.members.push(data.user)
                // console.log(JSON.stringify(lobby, null, 4));
                messageLobby(code, 'LOBBY_JOINED', lobby)
            }
        })
        socket.on('LEAVE_LOBBY', data => {
            const code = data.code
            const lobby = lobbies[code]

            if (!lobby) return

            if (lobby.host == socket.jwt.username) {
                messageLobby(code, 'LOBBY_CLOSED', null)
                console.log('lobby closed');
                lobbies[code] = undefined    
                return
            }
            lobby.members.splice(lobby.members.indexOf(getMember(lobby, socket.jwt._id)), 1)
            console.log('member left the lobby');
            messageLobby(code, 'LOBBY_LEFT', { members: lobby.members })
        })
    }
    
    return {
        handle
    }
}

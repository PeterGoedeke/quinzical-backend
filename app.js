require('dotenv').config()

const http = require('http')
const createError = require('http-errors')
const express = require('express')
const expressWs = require('express-ws')
const path = require('path')
var debug = require('debug')('server:server');

require('./models/db')


const app = express()

const server = http.createServer(app)

const url = require('url')
const jwt = require('jsonwebtoken')
const lobbies = require('./controllers/multiplayer')

const wsInstance = expressWs(app, server, {
    wsOptions: {
        verifyClient: function({ req }, done) {
            const { query: { token } } = url.parse(req.url, true)
            console.log('rwlkgjreljkghrkl')
            try {
                req.jwt = jwt.verify(token, process.env.TOKEN_SECRET)
                done(true)
            }
            catch (err) {
                return done(false, 403, 'Invalid token')
            }
        }
    }
})
app.ws('/', function(ws, req) {
    try {
        console.log('attempting connect')
        for(const client of wsInstance.getWss().clients) {
            if(client.jwt && client.jwt._id == req.jwt._id) {
                console.log('closed client')
                client.close()
            }
        }
        ws.jwt = req.jwt
    
        console.log('sending message')
        ws.send(JSON.stringify({
            messageType: 'connected',
        }))
    
        ws.on('message', message => {
            const response = JSON.parse(message)
            if (response.type) {
                lobbies.onMessage(response, ws)
            }
            else {
                console.error('Failed:', message)
            }
        })
    }
    catch(err) {
        console.log('weird', err)
    }
})

var port = process.env.PORT || '3000'
app.set('port', port);

const authRouter = require('./routes/auth')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/', authRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    console.log(err)

    // render the error page
    return res.status(err.status || 500).json(err.status)
})

// http server creation

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
        console.error(bind + ' requires elevated privileges')
        process.exit(1)
        break;
        case 'EADDRINUSE':
        console.error(bind + ' is already in use')
        process.exit(1)
        break
        default:
        throw error
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address()
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port
    debug('Listening on ' + bind)
}
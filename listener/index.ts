import { start } from './listener'
import { logger } from '../lib/logging'

const http = require('http')
const micro = require('micro')

const server = new http.Server(
    micro(async (req, res) => {
        res.end(`Hello from Micro!`)
    })
)
const port = process.env.PORT || 6000
start()
console.log(`server started on http://localhost:${port}`)
server.listen(port, err => {
    if (err) {
        logger.error(`error in server', ${err}`)
        throw err
    }
})

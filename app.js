// Load environment
const config = require("./app/config")

// Get root of project
const root = require("app-root-path")

// Module imports
// <insert here>

// Express related modules
const express = require('express')
const app = express()
const exphbs = require('express-handlebars')
const cookieParser = require('cookie-parser')
const formidable = require('express-formidable');
const slowDown = require("express-slow-down");

// Express Additional Options
// Express: Public Directory
app.use('/', express.static("public"))
app.use('/third_party', express.static("third_party"))

// Handlebars: Render engine
app.set('view engine', 'hbs')

// Handlebars: Environment options
app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: `views/layouts`
}))

// Handlebars: Views folder
app.set('views', [`views`])

// cookieParser: Secret key for signing
app.use(cookieParser(config.app.secretKey))

// cookieParser: Cookie schema
const CookieOptions = {
    httpOnly: true,
    secure: true,
    signed: true,
    domain: `.${config.webserver.domain}`
}

// Formidable: For POST data accessing
app.use(formidable());

// Slowdown: For Rate limiting
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // allow 100 requests per 15 minutes, then...
    delayMs: 500 // begin adding 500ms of delay per request above 100:
});
app.use(speedLimiter);

// Logging
const log = require('loglevel')
const prefix = require('loglevel-plugin-prefix')
const chalk = require('chalk')
const colors = {
    TRACE: chalk.magenta,
    DEBUG: chalk.cyan,
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red,
}
prefix.reg(log)
prefix.apply(log, {
    format(level, name, timestamp) {
        return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)}` // ${chalk.white(`${name}:`)}
    },
})
prefix.apply(log.getLogger('critical'), {
    format(level, name, timestamp) {
        return chalk.red.bold(`[${timestamp}] ${level} ${name}:`)
    },
})
if (config.debugMode === true) {
    log.setLevel("debug", true)
} else {
    log.setLevel("info", true)
}

// Express: Routes
const webserver = () => {
    app.get('/', (req, res) => {
        var metadata = {
            meta: {
                title: "Home",
                path: false
            },
            nav: {
                index: true
            }
        }
        res.render('index', metadata)
    })
    
    app.get('*', (req, res) => {
        var metadata = {
            meta: {
                title: "404",
                path: false
            },
            nav: {}
        }
        res.status = 404
        res.render('404', metadata)
    })

    app.listen(config.webserver.port, function (err) {
        if (err) throw log.error(err)
        log.debug(`Web server listening on port ${config.webserver.port} | http://${config.webserver.domain}`)
    })
}

webserver()
var myConsole = {
    log: console.log,
    error: console.error,
    info: console.info,
    allLogs: []
}

function superLog(type) {
    return function(logData) {
        myConsole[type](logData)

        var logText
        if (typeof logData == 'object') {
            logText = JSON.stringify(logData, null, '  ')
        } else {
            logText = String(logData)
        }

        var log = {
            type: type,
            text: logText
        }

        myConsole.allLogs.unshift(log)
    }
}

console.log = superLog('log')
console.error = superLog('error')
console.info = superLog('info')
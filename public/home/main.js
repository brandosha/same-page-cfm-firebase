var firebaseHandler;

document.addEventListener('DOMContentLoaded', function() {
    auth = firebase.auth()

    auth.onAuthStateChanged(async user => {
        if (!user) {
            window.location.replace('/sign-up')
        }

        firebaseHandler = new FirebaseHandler(firebase)
        await firebaseHandler.refreshAndConnectAll()
        loader.hide()

        console.log(firebaseHandler.dataObj)
    })
})

var debug = new Vue({
    el: '#debug',
    data: {
        debugging: true,
        command: '',
        logs: myConsole.allLogs
    },
    methods: {
        execute: function() {
            var command = this.command
            this.command = ''
            console.log(
                eval(command)
            )
        }
    },
    watch: {
        command: function() {
            var correctCommand = this.command
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"');

            this.command = correctCommand
        }
    }
})

var resizingDebug = false
var originalMouseY = 0
var originalHeight = 0

$('#debug-resize-control').mousedown(event => {
    resizingDebug = true
    originalMouseY = event.screenY
    originalHeight = $('#debug-body').height()
})

$(document).mouseup(event => {
    if (resizingDebug) resizingDebug = false
})

$(document).mousemove(event => {
    if (resizingDebug) {
        var difference = originalMouseY - event.screenY
        var newHeight = originalHeight + difference
        newHeight = Math.max(8, Math.min(newHeight, $(window).height()))
        $('#debug-body').height(newHeight)
        $('#debug-top').css('bottom', newHeight + 'px')
    }
})
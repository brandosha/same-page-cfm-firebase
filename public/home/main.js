var firebaseHandler;
/*var groupUI;
var groupSelectionUI;*/

var mainUI;

document.addEventListener('DOMContentLoaded', function() {
    auth = firebase.auth()

    auth.onAuthStateChanged(async user => {
        if (!user) {
            window.location.replace('/sign-up')
        }

        firebaseHandler = new FirebaseHandler(firebase)

        /*groupSelectionUI = new Vue({
            el: '#group-selection-ui',
            data: {
                firebaseData: firebaseHandler.dataObj
            },
            methods: {
                selectGroup: function(groupId) {
                    window.location.hash = groupId
                }
            }
        })*/

        mainUI = new Vue({
            el: '#vue-main',
            data: {
                firebaseData: firebaseHandler.dataObj,
                groupId: window.location.hash.slice(1),
                newMessage: ''
            },
            methods: {
                sendMessage: function() {
                    var messageText = this.newMessage
                    this.newMessage = ''
                    firebaseHandler.sendMessage(messageText, this.groupId)
                },
                selectGroup: function(groupId) {
                    window.location.hash = groupId
                }
            },
            computed: {
                isValidGroup: function() {
                    return firebaseHandler.groupExists(this.groupId)
                }
            }
        })

        $(window).on('hashchange', event => {
            var newHash = window.location.hash.slice(1)
            mainUI.groupId = newHash
        })

        await firebaseHandler.refreshAndConnectAll()
        loader.hide()
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
        newHeight = Math.max(8 - 70, Math.min(newHeight, $(window).height() - 70))
        $('#debug-body').height(newHeight)
        $('#debug-top').css('bottom', newHeight + 'px')
    }
})
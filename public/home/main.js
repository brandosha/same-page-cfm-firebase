document.addEventListener('DOMContentLoaded', function() {
    auth = firebase.auth()

    auth.onAuthStateChanged(async user => {
        if (!user) {
            window.location.replace('/sign-in')
            return
        }

        handleUI()
    })
})

var firebaseHandler
var mainUI

async function handleUI() {
    firebaseHandler = new FirebaseHandler(firebase)

    $(window).on('hashchange', event => {
        var newHash = window.location.hash.slice(1)
        mainUI.groupId = newHash
        mainUI.$nextTick(_ => {
            if (!mainUI.isValidGroup) return
            $('#messages').scrollTop($('#messages')[0].scrollHeight);
        })
    })

    await firebaseHandler.refreshAndConnectAll()

    mainUI = new Vue({
        el: '#vue-main',
        data: {
            firebaseData: firebaseHandler.dataObj,
            groupId: window.location.hash.slice(1),
            newMessage: ''
        },
        methods: {
            sendMessage: function() {
                var messageText = this.newMessage.trim()
                this.newMessage = ''
                firebaseHandler.sendMessage(messageText, this.groupId)
                .then(_ => {
                    if (!this.isValidGroup) return
                    $('#messages').stop().animate({
                        scrollTop: $('#messages')[0].scrollHeight
                    });
                })
            },
            selectGroup: function(groupId) {
                window.location.hash = groupId
            },
            lastMessage: function(groupId) {
                var messages = this.firebaseData.groups[groupId].messagesArr
                if (messages.length == 0) return 'No messages'

                var message =  messages[messages.length - 1]
                return this.firebaseData.users[message.from].name + ': ' + message.text
            }
        },
        computed: {
            isValidGroup: function() {
                return firebaseHandler.groupExists(this.groupId)
            },
            noGroups: function() {
                return Object.keys(this.firebaseData.groups).length == 0
            }
        },
        created: function() {
            this.$nextTick(_ => {
                if (this.isValidGroup) {
                    $('#messages').scrollTop($('#messages')[0].scrollHeight);
                }
                loader.hide()
            })
        }
    })
}

var debug = new Vue({
    el: '#debug',
    data: {
        debugging: false,
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
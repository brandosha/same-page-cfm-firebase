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
    await firebaseHandler.refreshAndConnectAll()

    mainUI = new Vue({
        el: '#vue-main',
        data: {
            firebaseData: firebaseHandler.dataObj,
            groupId: window.location.hash.slice(1),
            fullPage: fullPage,
            newMessage: ''
        },
        methods: {
            sendMessage: function() {
                var messageText = this.newMessage//.trim()
                this.newMessage = ''
                if (!this.isValidGroup) return
                firebaseHandler.sendMessage(messageText, this.groupId)
                .then(_ => {
                    $('#messages').stop().animate({
                        scrollTop: $('#messages')[0].scrollHeight
                    });
                })
            },
            deleteMessage: function(message) {
                var messageId = message.id
                firebaseHandler.deleteMessage(this.groupId, messageId)
            },
            selectGroup: function(groupId) {
                window.location.hash = groupId
            },
            formatMessage: function(lastMessage) {
                if (lastMessage === undefined) return 'No messages'
                return this.firebaseData.users[lastMessage.from].name.split(' ')[0] + ': ' + lastMessage.text
            },
            formatTime: function(message) {
                if (!(message.sent && message.sent.toLocaleString)) return
                return message.sent.toLocaleString(undefined, {
                    hour: 'numeric',
                    minute: 'numeric'
                }).replace(' ', '&nbsp;')
            },
            shouldAddDate: function(index) {
                if (index === 0) { return true }
                var prevMessage = this.firebaseData.groups[this.groupId].messagesArr[index - 1]
                var thisMessage = this.firebaseData.groups[this.groupId].messagesArr[index]
                if (prevMessage.sent && thisMessage.sent) {
                    var secondsBetween = thisMessage.sent.getTime() - prevMessage.sent.getTime()
                    return secondsBetween > 30 * 60 * 1000
                }
                return false
            },
            formatDate: function(index) {
                var message = this.firebaseData.groups[this.groupId].messagesArr[index]
                if (!(message.sent && message.sent.toLocaleString)) return

                var day = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24))
                var messageDay = Math.floor(message.sent.getTime() / (1000 * 60 * 60 * 24))
                if (day === messageDay) {
                    return '<b>Today</b> at ' + this.formatTime(message)
                } else if (day === messageDay + 1) {
                    return '<b>Yesterday</b> at ' + this.formatTime(message)
                }

                var dateSettings = {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                }
                if (message.sent.getYear() !== new Date().getYear()) dateSettings.year = 'numeric'

                var date = message.sent.toLocaleString(undefined, dateSettings)
                return '<b>' + date + '</b> at ' + this.formatTime(message)
            },
            initials: function(message) {
                var name = this.firebaseData.users[message.from].name
                var names = name.split(' ')
                if (names.length === 1) {
                    return name.substr(0, 1).toUpperCase()
                } else {
                    return (names[0].substr(0, 1) + names[names.length - 1].substr(0, 1)).toUpperCase()
                }
            },
            expandTextarea: function() {
                var messageBox = $('#message-textarea')
                if (messageBox[0].scrollHeight !== messageBox.height()) {
                    messageBox.height(1)
                    messageBox.height('calc(' + messageBox[0].scrollHeight + 'px + 0.15em)')
                    $('#messages').css('padding-bottom', 'calc(' + messageBox.height() + 'px + 3.35em)')
                }
            },
            messageInputEnter: function(event) {
                if (event.which === 13 && !event.shiftKey) {
                    event.preventDefault()
                    this.sendMessage()
                    setTimeout(this.expandTextarea, 100)
                }
            }
        },
        computed: {
            isValidGroup: function() {
                return firebaseHandler.groupExists(this.groupId)
            },
            noGroups: function() {
                return Object.keys(this.firebaseData.groups).length == 0
            },
            sendFormDisabled: function() {
                return {
                    input: this.firebaseData.offline,
                    submit: this.firebaseData.offline || this.newMessage.trim().length === 0
                }
            },
            disabledIfOffline: function() {
                if (this.firebaseData.offline) return 'disabled'
                return ''
            }
        },
        watch: {
            newMessage: function() { this.expandTextarea() }
        },
        created: function() {
            this.$nextTick(_ => {
                if (this.isValidGroup) {
                    $('#messages').scrollTop($('#messages')[0].scrollHeight);
                    this.expandTextarea()
                }
                handleFullPageLinks()
                loader.hide()
            })
        }
    })

    firebaseHandler.newMessageListener = function(groupId) {
        var messages = document.getElementById('messages')
        if (
            groupId === mainUI.groupId && 
            messages.scrollHeight - messages.scrollTop === messages.clientHeight
        ) {
            $('#messages').stop().animate({
                scrollTop: $('#messages')[0].scrollHeight
            });
        }
    }

    $(window).on('hashchange', event => {
        var newHash = window.location.hash.slice(1)
        mainUI.groupId = newHash
        mainUI.$nextTick(_ => {
            handleFullPageLinks()
            if (!mainUI.isValidGroup) return
            $('#messages').scrollTop($('#messages')[0].scrollHeight)
            mainUI.expandTextarea()
        })
    })
}

/*var debug = new Vue({
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
})*/

function resizeFullHeight() {
    $('.window-height').outerHeight(window.innerHeight)
}
resizeFullHeight()
$(window).resize(_ => {
    setTimeout(resizeFullHeight, 100)
})
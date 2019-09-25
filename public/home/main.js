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
            handleFullPageLinks()
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
                var thisMessage = this.firebaseData.groups[this.groupId].messagesArr[index]
                var nextMessage = this.firebaseData.groups[this.groupId].messagesArr[index + 1]
                if (thisMessage && thisMessage.sent && nextMessage && nextMessage.sent) {
                    var secondsBetween = nextMessage.sent.getTime() - thisMessage.sent.getTime()
                    return secondsBetween > 30 * 60 * 1000
                }
                return false
            },
            formatDate: function(index) {
                var message = this.firebaseData.groups[this.groupId].messagesArr[index + 1]
                if (!(message.sent && message.sent.toLocaleString)) return
                var date = message.sent.toLocaleString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                })
                return '<strong>' + date + '</strong> '
            },
            initials: function(message) {
                var name = this.firebaseData.users[message.from].name
                var names = name.split(' ')
                if (names.length === 1) {
                    return name.substr(0, 1).toUpperCase()
                } else {
                    return (names[0].substr(0, 1) + names[names.length - 1].substr(0, 1)).toUpperCase()
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
        created: function() {
            this.$nextTick(_ => {
                if (this.isValidGroup) {
                    $('#messages').scrollTop($('#messages')[0].scrollHeight);
                }
                handleFullPageLinks()
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

function resizeFullHeight() {
    $('.window-height').outerHeight(window.innerHeight)
}
resizeFullHeight()
$(window).resize(_ => {
    if (fullPage) setTimeout(resizeFullHeight, 500)
    else resizeFullHeight()
})
var firebaseHandler;
var mainUI;

document.addEventListener('DOMContentLoaded', function() {
    auth = firebase.auth()

    auth.onAuthStateChanged(async user => {
        if (!user) {
            window.location.replace('/sign-up')
        }

        firebaseHandler = new FirebaseHandler(firebase)

        $(window).on('hashchange', event => {
            var newHash = window.location.hash.slice(1)
            mainUI.groupId = newHash
            mainUI.$nextTick(_ => {
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
                    var messageText = this.newMessage
                    this.newMessage = ''
                    firebaseHandler.sendMessage(messageText, this.groupId)
                    .then(_ => {
                        $('#messages').stop().animate({
                            scrollTop: $('#messages')[0].scrollHeight
                        });
                    })
                },
                selectGroup: function(groupId) {
                    window.location.hash = groupId
                }
            },
            computed: {
                isValidGroup: function() {
                    return firebaseHandler.groupExists(this.groupId)
                }
            },
            created: function() {
                this.$nextTick(_ => {
                    $('#messages').scrollTop($('#messages')[0].scrollHeight);
                    loader.hide()
                })
            }
        })
    })
})

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
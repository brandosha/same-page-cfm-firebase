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

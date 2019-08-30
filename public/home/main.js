document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) { 
            window.location.replace('/sign-up')
        } else {
            loading.hide()
        }

        console.log(user.uid)
    })
})

var loading = new Vue({
    el: '#loading',
    methods: {
        hide: function() {
            $('#loading').hide()
        },
        show: function() {
            $('#loading').show()
        }
    }
})
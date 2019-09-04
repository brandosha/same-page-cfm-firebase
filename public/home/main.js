var db
var groups = localStorage.getItem('groups')
groups = groups ? JSON.parse(groups) : []

document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            window.location.replace('/sign-up')
        }

        db = firebase.firestore()
        
        var membersGroup = db.collectionGroup('members')
        var memberQuery = membersGroup.where('userId', '==', user.uid)
        .get()
        .then(snapshot => {
            if (snapshot.size == groups.size) {
                loading.hide()
                return
            }

            groups = []
            snapshot.forEach(docSnapshot => {
                groups.push(docSnapshot.ref.parent.parent.id)
            })

            localStorage.setItem('groups', JSON.stringify(groups))
            loading.hide()
        })
        .catch(error => {
            console.error(error)
            loading.hide()
        })
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
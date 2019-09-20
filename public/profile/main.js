window.onload = function() {
    const auth = firebase.auth()
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.replace('/sign-in')
            return
        }

        myUid = user.uid
        myEmail = user.email

        handleUI()
    })
}

var mainUI
var myUid
var myEmail


async function handleUI() {
    var firestore = firebase.firestore()
    var profileDoc = await firestore.doc('users/' + myUid).get()
    var profileData = profileDoc.data()

    mainUI = new Vue({
        el: '#vue-main',
        data: {
            name: profileData.name,
            email: myEmail,
            editing: false
        },
        methods: {
            saveEdits: function() {
                loader.show()

                if (this.canSave) {
                    firestore.doc('users/' + myUid).set({
                        name: this.name.trim()
                    })
                    .then(_ => {
                        location.href = '/home'
                    })
                }
            }
        },
        computed: {
            canSave: function() {
                return this.name.trim().length > 0 &&
                    this.name !== profileData.name
            }
        },
        watch: {
            editing: function() {
                if (!this.editing) {
                    this.name = profileData.name
                }
            }
        }
    })

    handleFullPageLinks()
    loader.hide()
}
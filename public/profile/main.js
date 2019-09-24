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
    var storage = firebase.storage()
    var firestore = firebase.firestore()
    var profileDoc = await firestore.doc('users/' + myUid).get()
    var profileData = profileDoc.data()

    if (profileData.hasAvatar) {
        var avatarRef = storage.ref().child('avatars').child(myUid)
        var avatarUrl = await avatarRef.getDownloadURL()
    }

    var uploadModal = $('#upload-modal')
    var uploadCrop = $('#croppie')
    uploadCrop.croppie({
        viewport: {
            width: 200,
            height: 200,
            type: 'circle'
        },
        boundary: {
            width: 250,
            height: 250
        }
    })

    mainUI = new Vue({
        el: '#vue-main',
        data: {
            avatar: profileData.hasAvatar ? avatarUrl : null,
            newAvatarData: null,
            email: myEmail,
            name: profileData.name,
            editing: false
        },
        methods: {
            initials: function() {
                var name = this.name
                var names = name.split(' ')
                if (names.length === 1) {
                    return name.substr(0, 1).toUpperCase()
                } else {
                    return (names[0].substr(0, 1) + names[names.length - 1].substr(0, 1)).toUpperCase()
                }
            },
            imgUpload: function(event) {
                var input = event.target
                if (input.files && input.files[0]) {
                    uploadModal.modal('show')
                    uploadModal.on('shown.bs.modal', _ => {
                        var reader = new FileReader()
                        reader.onload = function (e) {
                            uploadCrop.croppie('bind', {
                                url: e.target.result
                            })
                        }
                        reader.readAsDataURL(input.files[0])
                    })
                }
            },
            handleUploadedImage: function() {
                uploadCrop.croppie('result', {
                    type: 'base64',
                    circle: true
                })
                .then(result => {
                    this.newAvatarData = result
                    uploadModal.modal('hide')
                })
            },
            saveEdits: async function() {
                loader.show()

                if (this.canSave) {
                    var avatar = this.newAvatarData
                    var myAvatarRef = storage.ref().child('avatars').child(myUid)

                    var newData = {
                        name: this.name.trim()
                    }

                    if (avatar === null) {
                        await myAvatarRef.delete()
                        newData.hasAvatar = false
                    } else if (avatar !== profileData.avatar) {
                        await myAvatarRef.putString(avatar, 'data_url')
                        newData.hasAvatar = true
                        newData.avatarUpdated = new Date()
                    }

                    await firestore.doc('users/' + myUid).update(newData)
                    location.href = '/home'
                }
            }
        },
        computed: {
            canSave: function() {
                return this.name.trim().length > 0 && (
                    this.name.trim() !== profileData.name.trim() ||
                    this.newAvatarData !== null
                )
            }
        },
        watch: {
            editing: function() {
                if (!this.editing) {
                    this.name = profileData.name
                    this.newAvatarData = null
                }
            }
        }
    })

    handleFullPageLinks()
    loader.hide()
}
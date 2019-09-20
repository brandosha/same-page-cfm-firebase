window.onload = function() {
    const auth = firebase.auth()
    auth.onAuthStateChanged(user => {
        if (user !== null) {
            window.location.replace('/home')
            return
        }
        loader.hide()
    })
}

handleFullPageLinks()
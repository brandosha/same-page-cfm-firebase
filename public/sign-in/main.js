

var auth
document.addEventListener('DOMContentLoaded', () => {
  auth = firebase.auth()
  auth.onAuthStateChanged(user => {
    if (user !== null) {
      window.location.replace('/home')
    } else {
      loader.hide()
    }
  })
})

var signUpForm = new Vue({
  el: '#sign-up-form',
  data: {
    email: '',
    password: ''
  },
  methods: {
    handleFormSubmit: function() {
      var self = this
      loader.show()
      auth.signInWithEmailAndPassword(this.email, this.password)
      .catch(error => {
        self.password = ''
        loader.hide()
        $('#invalid-credentials').show()
      })
    }
  }
})

handleFullPageLinks()
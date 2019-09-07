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
      loader.show()
      auth.signInWithEmailAndPassword(this.email, this.password)
      .catch(error => {
        loader.hide()
        $('#invalid-credentials').show()
      })
    }
  }
})


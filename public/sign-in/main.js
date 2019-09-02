var auth
document.addEventListener('DOMContentLoaded', () => {
  auth = firebase.auth()
  auth.onAuthStateChanged(user => {
    if (user !== null) {
      window.location.replace('/home')
    } else {
      loading.hide()
    }
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

var signUpForm = new Vue({
  el: '#sign-up-form',
  data: {
    email: '',
    password: ''
  },
  methods: {
    handleFormSubmit: function() {
      loading.show()
      auth.signInWithEmailAndPassword(this.email, this.password)
      .catch(error => {
        loading.hide()
        $('#invalid-credentials').show()
      })
    }
  }
})


var auth
document.addEventListener('DOMContentLoaded', () => {
    auth = firebase.auth()
    const db = firebase.firestore()
    auth.onAuthStateChanged(user => {
        if (user !== null && !signUpForm.formSubmitted) {
            window.location.replace('/home')
            return
        }

        if (user === null) {
            loader.hide()
            return
        }
        db.collection('users').doc(user.uid).set({
            avatar: null,
            dateCreated: new Date(),
            name: signUpForm.nameInput.value
        })
        .then(() => {
            user.sendEmailVerification()
            window.location.href = '/home'
        })
    })
})

var loader = {
    hide() {
        $('#loader').hide()
    },
    show() {
        $('#loader').show()
    }
}

var signUpForm = new Vue({
    el: '#sign-up-form',
    data: {
        nameInput: {
            el: '#name',
            value: '',
            isValid: false,
            error: 'Enter your name',
            classes: { }
        },
        emailInput: {
            el: '#email',
            value: '',
            isValid: false,
            error: 'Enter your email',
            classes: { }
        },
        passwordInput: {
            el: '#password',
            value: '',
            isValid: false,
            error: 'Enter a password',
            classes: { }
        },
        confirmPasswordInput: {
            el: '#confirm-password',
            value: '',
            isValid: false,
            error: 'Does not match password',
            classes: { }
        },
        formSubmitted: false
    },
    methods: {
        getClassObj: function(isValid) {
            if (!this.formSubmitted) return { }

            return {
                'is-valid': isValid,
                'is-invalid': !isValid
            }
        },
        handleFormSubmit: function() {
            this.formSubmitted = true

            this.nameInput.classes = this.getNameInputClasses()
            this.emailInput.classes = this.getEmailInputClasses()
            this.passwordInput.classes = this.getPasswordInputClasses()
            this.confirmPasswordInput.classes = this.getConfirmPasswordInputClasses()

            $('.-valid-feedback').addClass('valid-feedback')
            $('.-valid-feedback').removeClass('-valid-feedback')

            var formValid = true
            if (!this.nameInput.isValid) formValid = false
            if (!this.emailInput.isValid) formValid = false
            if (!this.passwordInput.isValid) formValid = false
            if (!this.confirmPasswordInput.isValid) formValid = false

            if (!formValid) return

            loader.show()
            auth.createUserWithEmailAndPassword(this.emailInput.value, this.passwordInput.value)
                .catch(error => {
                    loader.hide()
                    if (error.code == 'auth/invalid-email') {
                        this.emailInput.isValid = false
                        this.emailInput.error = 'Enter a valid email'
                        this.emailInput.classes = this.getClassObj(false)
                    } else if (error.code == 'auth/email-already-in-use') {
                        this.emailInput.isValid = false
                        this.emailInput.error = 'Email already in use'
                        this.emailInput.classes = this.getClassObj(false)
                    } else {
                        alert(error.message)
                    }
                })
        },
        getNameInputClasses: function() {
            const isValid =
                this.nameInput.value !== ''

            this.nameInput.isValid = isValid
            return this.getClassObj(isValid)
        },
        getEmailInputClasses: function() {
            if (this.emailInput.value === '') {
                this.emailInput.error = 'Enter your email'
                this.emailInput.isValid = false
                return this.getClassObj(false)
            }

            const split = this.emailInput.value.split('@')
            var isValid =
                split.length === 2 &&
                split[0].length > 0

            if (isValid) {
                const secondSplit = split[1].split('.')
                isValid = 
                    secondSplit.length > 1 &&
                    secondSplit[0].length > 0 &&
                    secondSplit[1].length > 1
            }    
            
            this.emailInput.error = 'Enter a valid email'
            this.emailInput.isValid = isValid
            return this.getClassObj(isValid)
        },
        getPasswordInputClasses: function() {
            if (this.passwordInput.value === '') {
                this.passwordInput.error = 'Enter a password'
                this.passwordInput.isValid = false
                return this.getClassObj(false)
            }

            const isValid =
                this.passwordInput.value.length >= 6

            this.passwordInput.error = 'Password must be at least 6 characters'
            this.passwordInput.isValid = isValid
            return this.getClassObj(isValid)
        },
        getConfirmPasswordInputClasses: function() {
            if (this.passwordInput.value.length < 6) {
                this.confirmPasswordInput.error = 'Enter a valid password'
                this.confirmPasswordInput.isValid = false
                return this.getClassObj(false)
            }

            const isValid =
                this.passwordInput.value.length >= 6 && 
                this.confirmPasswordInput.value === this.passwordInput.value

            this.confirmPasswordInput.error = 'Does not match password'
            this.confirmPasswordInput.isValid = isValid
            return this.getClassObj(isValid)
        }
    },
    watch: {
        'nameInput.value': function() {
            this.nameInput.classes = this.getNameInputClasses()
        },
        'emailInput.value': function() {
            this.emailInput.classes = this.getEmailInputClasses()
        },
        'passwordInput.value': function() {
            this.passwordInput.classes = this.getPasswordInputClasses()
        },
        'confirmPasswordInput.value': function() {
            this.confirmPasswordInput.classes = this.getConfirmPasswordInputClasses()
        }
    }
})

handleFullPageLinks()
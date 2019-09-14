window.onload = function() {
    const auth = firebase.auth()
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.replace('/sign-in')
            return
        }

        myEmail = user.email
        handleUI()
    })
}

var myEmail
var mainUI

function handleUI() {
    loader.hide()

    Vue.component('member-input', {
        props: ['member', 'displayFeedback'],
        template: `
        <div class="pb-2">
          <div class="input-group">
            <input 
              class="form-control"
              :class="{
                  'is-invalid': !member.validEmail && displayFeedback,
                  'is-valid': member.validEmail && displayFeedback
              }"
              type="text"
              placeholder="Email address"
              v-model="member.email"
            >
            <div class="input-group-append">
              <div class="input-group-text">
                <input type="checkbox" :id="'manager-toggle-'+member.key" v-model="member.manager">
                <label class="pl-2 m-0" :for="'manager-toggle-'+member.key">
                Manager
                </label>
              </div>
              <button
                type="button"
                class="btn btn-sm btn-danger py-0"
                style="z-index: 0;"
                @click="$emit('remove')"
              > 
                <span class="h5 p-0 m-0 d-inline">&times;</span>
              </button>
            </div>
          </div>
          <div 
            class="invalid-feedback"
            :class="{
                'd-block': !member.validEmail && displayFeedback
            }"
          >
          Invalid email
          </div>
        </div>
        `,
        watch: {
            'member.email': function() {
                const split = this.member.email.split('@')
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

                this.member.validEmail = isValid
            }
        }
    })

    var functions = firebase.functions()
    var createGroup = functions.httpsCallable('createGroup')
    mainUI = new Vue({
        el: '#vue-main',
        data: {
            groupName: '',
            validGroupName: false,
            myEmail: myEmail,
            memberInputs: [{
                email: '',
                manager: false,
                validEmail: false,
                key: 0
            }],
            minKey: 0,
            submitted: false
        },
        methods: {
            createGroup: function() {
                this.submitted = true

                if (!this.validGroupName) return
                var invalidInputs = this.memberInputs.filter(input => {
                    return !input.validEmail
                })
                if (invalidInputs.length > 0) return

                var members = this.memberInputs.map(member => {
                    return {
                        email: member.email,
                        isManager: member.manager
                    }
                })

                // functions.useFunctionsEmulator('http://localhost:5001')
                loader.show()
                createGroup({
                    name: this.groupName,
                    members: members
                })
                .then(result => {
                    var newGroup = result.data
                    var currentGroups = localStorage.getItem('groups')
                    currentGroups = currentGroups !== null ? JSON.parse(currentGroups) : { }
                    currentGroups[newGroup.id] = { 
                        members: newGroup.members,
                        name: newGroup.name
                    }
                    localStorage.setItem('groups', JSON.stringify(currentGroups))

                    window.location.href = '/home/#created-group:' + newGroup.id
                })
            },
            addMember: function() {
                this.memberInputs.push({
                    email: '',
                    manager: false,
                    validEmail: false,
                    key: ++this.minKey
                })
            }
        },
        watch: {
            groupName: function() {
                var trimmed = this.groupName.trim()
                if (trimmed.length > 0) {
                    this.validGroupName = true
                } else {
                    this.validGroupName = false
                }
            }
        }
    })
}
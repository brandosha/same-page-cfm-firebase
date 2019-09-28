window.onload = function() {
    const auth = firebase.auth()
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.replace('/sign-in')
            return
        }

        groupId = window.location.hash.slice(1)
        firebaseHandler = new FirebaseHandler(firebase)
        if (!firebaseHandler.groupExists(groupId)) {
            this.location.replace('/home')
        }

        myUid = user.uid
        handleUI()
    })
}

var mainUI
var myUid
var groupId
var firebaseHandler


async function handleUI() {
    await firebaseHandler.refreshGroups()
    await firebaseHandler.refreshGroupMembers(groupId)
    await firebaseHandler.refreshUsers()

    var firestore = firebase.firestore()
    var functions = firebase.functions()
    functions.useFunctionsEmulator('http://localhost:5001')
    var searchEmailAddresses = functions.httpsCallable('searchEmailAddresses')

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

    function copy(obj) {
        return JSON.parse(JSON.stringify(obj))
    }

    var deletedMembers = { }
    for (const userId in firebaseHandler.dataObj.groups[groupId].members) {
        deletedMembers[userId] = false
    }

    mainUI = new Vue({
        el: '#vue-main',
        data: {
            firebaseData: firebaseHandler.dataObj,
            groupId: groupId,
            groupName: firebaseHandler.dataObj.groups[groupId].name,
            groupMemberData: copy(firebaseHandler.dataObj.groups[groupId].members),
            deletedMembers: deletedMembers,
            canEdit: firebaseHandler.dataObj.groups[groupId].members[myUid].isManager,
            editing: false,
            memberInputs: [],
            minKey: 0,
            submitted: false
        },
        methods: {
            saveEdits: async function() {
                this.submitted = true
                if (!this.canSave) return

                loader.show()

                var newMemberData = this.groupMemberData
                var oldMemberData = this.firebaseData.groups[groupId].members

                var promises = []

                if (this.groupName.trim() !== this.firebaseData.groups[groupId].name.trim()) {
                    promises.push(
                        firestore.doc('groups/' + this.groupId).update({
                            name: this.groupName.trim()
                        })
                    )
                }

                for (const memberId in newMemberData) {
                    var newMem = newMemberData[memberId]
                    var oldMem = oldMemberData[memberId]
                    if (this.deletedMembers[memberId]) {
                        promises.push(
                            firestore.doc('groups/' + this.groupId + '/members/' + memberId).delete()
                        )
                    } else if (oldMem.isManager !== newMem.isManager) {
                        promises.push(
                            firestore.doc('groups/' + this.groupId + '/members/' + memberId).update({
                                isManager: newMem.isManager
                            })
                        )
                    }
                }

                var memInputsObj = { }
                var emails = []
                this.memberInputs.forEach(mem => {
                    emails.push(mem.email)
                    memInputsObj[mem.email] = mem.manager
                })

                var emailUids = { data: [] }
                if (emails.length > 0) {
                    emailUids = await searchEmailAddresses({
                        groupId: groupId,
                        emailAddresses: emails
                    })
                }

                emailUids.data.forEach(result => {
                    if (result.uid in oldMemberData || result.uid === null) return
                    promises.push(
                        firestore.doc('groups/' + this.groupId + '/members/' + result.uid).set({
                            isManager: memInputsObj[result.email]
                        })
                    )
                })

                await Promise.all(promises)
                location.href = '/home'
            },
            leaveGroup: function() {
                loader.show()
                firestore.doc('groups/' + this.groupId + '/members/' + myUid).delete()
                .then(_ => {
                    localStorage.removeItem(this.groupId + '_messages')
                    location.href = '/home/#left-group:' + this.groupId
                })
            },
            addMember: function() {
                this.memberInputs.push({
                    email: '',
                    manager: false,
                    validEmail: false,
                    key: ++this.minKey
                })
            },
            initials: function(userId) {
                var name = this.firebaseData.users[userId].name
                var names = name.split(' ')
                if (names.length === 1) {
                    return name.substr(0, 1).toUpperCase()
                } else {
                    return (names[0].substr(0, 1) + names[names.length - 1].substr(0, 1)).toUpperCase()
                }
            }
        },
        computed: {
            canSave: function() {
                var noManagers = true
                var noneDeleted = true
                for (const memId in this.groupMemberData) {
                    if (this.groupMemberData[memId].isManager && !this.deletedMembers[memId]) noManagers = false
                    if (this.deletedMembers[memId]) noneDeleted = false
                }

                var noEdits = 
                    this.groupName.trim() === this.firebaseData.groups[groupId].name.trim() &&
                    noneDeleted &&
                    this.memberInputs.length === 0 &&
                    JSON.stringify(this.groupMemberData) === JSON.stringify(this.firebaseData.groups[groupId].members)
                    
                var invalidInputs = this.memberInputs.filter(input => {
                    return !input.validEmail
                })
                
                return this.canEdit &&
                    !noManagers &&
                    !noEdits &&
                    (
                        !this.submitted ||
                        invalidInputs.length === 0
                    )
            }
        },
        watch: {
            editing: function() {
                if (!this.editing) {
                    this.groupMemberData = copy(this.firebaseData.groups[groupId].members)
                    this.memberInputs = []
                    this.groupName = firebaseHandler.dataObj.groups[groupId].name
                    for (const userId in this.deletedMembers) {
                        this.deletedMembers[userId] = false
                    }
                }
            }
        }
    })

    handleFullPageLinks()
    loader.hide()
}
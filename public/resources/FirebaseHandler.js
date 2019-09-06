var offlineOverride = true

class FirebaseHandler {
    constructor(firebase) {
        this.auth = firebase.auth()
        this.firestore = firebase.firestore()
        this.functions = firebase.functions()

        var groups = localStorage.getItem('groups')
        groups = groups !== null ? JSON.parse(groups) : { }

        this.dataObj = {
            groups: groups,
            users: { },
            uid: this.auth.currentUser.uid,
            offline: !navigator.onLine || offlineOverride
        }

        this.getLocalUsers()
    }

    getLocalUsers() {
        var users = []
        for (const groupId in this.dataObj.groups) {
            var group = this.dataObj.groups[groupId]
            for (const uid in group.members) {
                if (!users.includes(uid)) {
                    users.push(uid)
                }
            }
        }

        users.forEach(userId => {
            var userData = localStorage.getItem('user_' + userId)
            userData = userData !== null ? JSON.parse(userData) : { } 
            this.dataObj.users[userId] = userData
        })
    }

    async refreshGroups() {
        if (this.dataObj.offline) return

        var groupsData = { }

        await this.auth.currentUser.getIdToken(true)
        var tokenInfo = await this.auth.currentUser.getIdTokenResult()
        var groupIds = Object.keys(tokenInfo.claims.groups)

        await asyncForEach(groupIds, async groupId => {
            var groupData = await this.firestore.doc('groups/' + groupId).get()
            groupData = groupData.data()
            groupsData[groupId] = {
                name: groupData.name
            }
        })

        this.dataObj.groups = groupsData
        localStorage.setItem('groups', JSON.stringify(groupsData))
    }

    async refreshGroupMembers(groupId) {
        if (this.dataObj.offline) return

        var groupExists = groupId in this.dataObj.groups
        if (!groupExists) {
            throw new Error('No group found with id ' + groupId)
        }

        var groupMembers = { }

        var membersCollection = await this.firestore.collection('groups/' + groupId + '/members').get()
        membersCollection.forEach(snapshot => {
            groupMembers[snapshot.id] = {
                isManager: snapshot.data().isManager
            }
        })

        this.dataObj.groups[groupId].members = groupMembers
        localStorage.setItem('groups', JSON.stringify(this.dataObj.groups))
    }

    async refreshUsers() {
        var userIds = Object.keys(this.dataObj.users)
        var self = this
        asyncForEach(userIds, async userId => {
            var userData = await this.firestore.doc('users/' + userId).get()
            userData = userData.data()

            var userObj = {
                name: userData.name
            }
            self.dataObj.users[userId] = userObj
            localStorage.setItem('user_' + userId, JSON.stringify(userObj))
        })
    }
}

async function asyncForEach(array, callback) {
    for (let i = 0; i < array.length; i++) {
        await callback(array[i], i, array)
    }
}
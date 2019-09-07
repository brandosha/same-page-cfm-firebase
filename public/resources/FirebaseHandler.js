var offlineOverride = true

class FirebaseHandler {
    constructor(firebase) {
        this.auth = firebase.auth()
        this.firestore = firebase.firestore()
        this.functions = firebase.functions()

        var groups = getLocalObj('groups')

        this.dataObj = {
            groups: groups,
            users: { },
            uid: this.auth.currentUser.uid,
            offline: !navigator.onLine || offlineOverride
        }

        this.getLocalUsers()
        this.getLocalMessages()

        window.addEventListener('offline', this.connectionStatusChanged)
        window.addEventListener('online', this.connectionStatusChanged)
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
            var userData = getLocalObj('user_' + userId)
            this.dataObj.users[userId] = userData
        })
    }

    getLocalMessages() {
        var groupIds = Object.keys(this.dataObj.groups)
        groupIds.forEach(groupId => {
            var messages = getLocalObj(groupId + '_messages')
            for (const messageId in messages) {
                messages[messageId].sent = new Date(messages[messageId].sent)
            }
            this.dataObj.groups[groupId].messages = messages
        })
    }

    connectionStatusChanged() {
        var offline = !navigator.offline
        this.dataObj.offline = offline

        this.refreshAndConnectAll()
    }

    async refreshAndConnectAll() {
        var self = this

        await this.refreshGroups()
        var groupIds = Object.keys(this.dataObj.groups)
        await asyncForEach(groupIds, async groupId => {
            await self.refreshGroupMembers(groupId)
            await self.refreshMessages(groupId)
        })
        await this.refreshUsers()
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

        if (!this.groupExists(groupId)) {
            throw new Error('No group with id ' + groupId)
        }

        var groupMembers = { }

        var membersQuery = await this.firestore.collection('groups/' + groupId + '/members').get()
        membersQuery.forEach(snapshot => {
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

    groupExists(groupId) {
        return groupId in this.dataObj.groups
    }

    async refreshMessages(groupId) {
        if (this.dataObj.offline) return

        if (!this.groupExists(groupId)) {
            throw new Error('No group with id ' + groupId)
        }

        var messages = { }

        var messagesQuery = await this.firestore.collection('groups/' + groupId + '/messages').get()
        messagesQuery.forEach(snapshot => {
            var messageData = snapshot.data()
            messages[snapshot.id] = {
                from: messageData.from,
                text: messageData.text,
                sent: messageData.sent.toDate()
            }
        })

        this.dataObj.groups[groupId].messages = messages
        localStorage.setItem(groupId + '_messages', JSON.stringify(messages))
    }
}

async function asyncForEach(array, callback) {
    for (let i = 0; i < array.length; i++) {
        await callback(array[i], i, array)
    }
}

function getLocalObj(key) {
    var data = localStorage.getItem(key)
    return data !== null ? JSON.parse(data) : { }
}
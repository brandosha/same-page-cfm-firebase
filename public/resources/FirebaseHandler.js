var offlineOverride = false

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
        this.listenerUnsubscribers = []
        this.sentMessageIds = []

        this.getLocalUsers()
        this.getLocalMessages()

        window.addEventListener('offline', this.connectionStatusChanged.bind(this))
        window.addEventListener('online', this.connectionStatusChanged.bind(this))
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
        var offline = !navigator.onLine
        this.dataObj.offline = offline

        console.log('Connection is now ' + (offline ? 'offline' : 'online'))

        if (!offline) {
            this.refreshAndConnectAll()
        } else {
            this.listenerUnsubscribers.forEach(unsubscribe => {
                unsubscribe()
            })
            this.listenerUnsubscribers = []
        }
    }

    async refreshAndConnectAll() {
        var self = this

        await this.refreshGroups()
        var groupIds = Object.keys(this.dataObj.groups)
        await asyncForEach(groupIds, async groupId => {
            await self.refreshGroupMembers(groupId)
            await self.refreshMessages(groupId)

            var unsubscriber = this.firestore.collection('groups/' + groupId + '/messages')
            .onSnapshot(querySnapshot => {
                querySnapshot.docChanges().forEach(change => {
                    var snapshot = change.doc
                    if (change.type === 'removed') {
                        this.dataObj.groups[groupId].messages[snapshot.id] = undefined
                    } else if (!(snapshot.id in this.dataObj.groups[groupId].messages)) {
                        var messageData = snapshot.data()
                        if (messageData.sent === null) return

                        this.dataObj.groups[groupId].messages[snapshot.id] = {
                            from: messageData.from,
                            text: messageData.text,
                            sent: messageData.sent.toDate()
                        }
                    }
                })

                localStorage.setItem(groupId + '_messages', JSON.stringify(this.dataObj.groups[groupId].messages))
            })
            this.listenerUnsubscribers.push(unsubscriber)
        })
        await this.refreshUsers()
    }

    async refreshGroups() {
        if (this.dataObj.offline) return

        await this.auth.currentUser.getIdToken(true)
        var tokenInfo = await this.auth.currentUser.getIdTokenResult()
        var groupIds = Object.keys(tokenInfo.claims.groups)

        await asyncForEach(groupIds, async groupId => {
            var groupData = await this.firestore.doc('groups/' + groupId).get()
            groupData = groupData.data()
            if (groupId in this.dataObj.groups) {
                this.dataObj.groups[groupId].name = groupData.name
            } else {
                this.dataObj.groups[groupId] = {
                    name: groupData.name
                }
            }
        })

        var groupsData = copyOf(this.dataObj.groups)
        for (const groupId in groupsData) {
            groupsData[groupId].messages = undefined
        }
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

        var groupsData = copyOf(this.dataObj.groups)
        for (const groupId in groupsData) {
            groupsData[groupId].messages = undefined
        }
        localStorage.setItem('groups', JSON.stringify(groupsData))
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
            if (
                this.dataObj.groups[groupId].messages !== undefined && 
                snapshot.id in this.dataObj.groups[groupId].messages
            ) {
                messages[snapshot.id] = this.dataObj.groups[groupId].messages[snapshot.id]
                return
            }

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

    async sendMessage(text, groupId) {
        if (this.dataObj.offline) return

        if (text.length < 0 || typeof text !== 'string') return

        if (!this.groupExists(groupId)) {
            throw new Error('No group with id ' + groupId)
        }

        var messageObj = {
            from: this.dataObj.uid,
            sent: firebase.firestore.FieldValue.serverTimestamp(),
            text: text
        }

        var localObj = {
            from: this.dataObj.uid,
            text: text
        }
        var tempId = 'sending_' + Math.random().toString(36).substring(2)
        this.dataObj.groups[groupId].messages[tempId] = localObj

        var newDoc = await this.firestore.collection('groups/' + groupId + '/messages').add(messageObj)
        
        this.dataObj.groups[groupId].messages[tempId] = undefined
        localObj.sent = new Date()
        this.dataObj.groups[groupId].messages[newDoc.id] = localObj
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

function copyOf(obj) {
    return JSON.parse(JSON.stringify(obj))
}
var offlineOverride = false

class FirebaseHandler {
    constructor(firebase) {
        this.auth = firebase.auth()
        this.firestore = firebase.firestore()
        this.functions = firebase.functions()
        // this.functions.useFunctionsEmulator('http://localhost:5001')

        var groups = getLocalObj('groups')

        this.dataObj = {
            groups: groups,
            groupArr: [],
            users: { },
            uid: this.auth.currentUser.uid,
            offline: !navigator.onLine || offlineOverride
        }
        this.listenerUnsubscribers = []
        this.sentMessageIds = []

        this.getLocalUsers()
        this.getLocalMessages()

        for (const groupId in this.dataObj.groups) {
            this.createMessagesArray(groupId)
        }
        this.createGroupArray()

        window.addEventListener('offline', this.connectionStatusChanged.bind(this))
        window.addEventListener('online', this.connectionStatusChanged.bind(this))
    }

    getAssociatedUserIds() {
        var users = []
        for (const groupId in this.dataObj.groups) {
            var group = this.dataObj.groups[groupId]
            for (const uid in group.members) {
                if (!users.includes(uid)) {
                    users.push(uid)
                }
            }
        }

        return users
    }

    getLocalUsers() {
        var users = this.getAssociatedUserIds()

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
            this.dataObj.groups[groupId].messagesObj = messages
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

    createMessagesArray(groupId) {
        var messagesObj = this.dataObj.groups[groupId].messagesObj

        var messagesArr = []
        for (const messageId in messagesObj) {
            var messageObj = messagesObj[messageId]

            messagesArr.push({
                from: messageObj.from,
                sent: messageObj.sent,
                text: messageObj.text
            })
        }

        messagesArr.sort((a, b) => {
            return a.sent.getTime() - b.sent.getTime()
        })

        this.dataObj.groups[groupId].messagesArr = messagesArr
    }

    createGroupArray() {
        var groupArr = Object.keys(this.dataObj.groups).map(groupId => {
            var group = this.dataObj.groups[groupId]
            return {
                id: groupId,
                name: group.name,
                lastMessage: group.messagesArr[group.messagesArr.length - 1]
            }
        })

        groupArr = groupArr.sort((a, b) => {
            let aTimeNum = a.lastMessage === undefined ? 0 : a.lastMessage.sent.getTime()
            let bTimeNum = b.lastMessage === undefined ? 0 : b.lastMessage.sent.getTime()
            return bTimeNum - aTimeNum
        })

        this.dataObj.groupArr = groupArr
    }

    async refreshAndConnectAll() {
        if (this.dataObj.offline) return

        var self = this

        await this.refreshGroups()
        var groupIds = Object.keys(this.dataObj.groups)
        await asyncForEach(groupIds, async groupId => {
            await self.refreshGroupMembers(groupId)
            await self.refreshMessages(groupId)
            this.createMessagesArray(groupId)

            var unsubscriber = this.firestore.collection('groups/' + groupId + '/messages').where('sent', '>', new Date())
            .onSnapshot(querySnapshot => {
                querySnapshot.docChanges().forEach(change => {
                    var snapshot = change.doc
                    if (change.type === 'removed') {
                        var deletedMessage = this.dataObj.groups[groupId].messagesObj[snapshot.id]

                        var messageRemoved = false
                        this.dataObj.groups[groupId].messagesArr = 
                        this.dataObj.groups[groupId].messagesArr.filter(value => {
                            if (messageRemoved) return true

                            if (
                                value.from == deletedMessage.from &&
                                value.text == deletedMessage.text &&
                                value.sent.getTime() == deletedMessage.sent.getTime()
                            ) {
                                messageRemoved = true
                                return false
                            }
                            return true
                        })

                        this.dataObj.groups[groupId].messagesObj[snapshot.id] = undefined
                    } else if (!(snapshot.id in this.dataObj.groups[groupId].messagesObj)) {
                        var messageData = snapshot.data()
                        if (messageData.sent === null) return

                        var messageObj = {
                            from: messageData.from,
                            text: messageData.text,
                            sent: messageData.sent.toDate()
                        }

                        this.dataObj.groups[groupId].messagesObj[snapshot.id] = messageObj
                        this.dataObj.groups[groupId].messagesArr.push(messageObj)

                        this.newMessageInGroup(groupId)
                    }
                })

                localStorage.setItem(groupId + '_messages', JSON.stringify(this.dataObj.groups[groupId].messagesObj))
            })
            this.listenerUnsubscribers.push(unsubscriber)
        })
        this.createGroupArray()
        await this.refreshUsers()
    }

    newMessageInGroup(groupId) {
        var self = this

        var updatedGroup
        var updateIndex
        this.dataObj.groupArr.forEach((group, index) => {
            if (group.id !== groupId) return
            var groupMessages = self.dataObj.groups[group.id].messagesArr
            updatedGroup = group
            updatedGroup.lastMessage = groupMessages[groupMessages.length - 1]
            updateIndex = index
        })

        this.dataObj.groupArr.splice(updateIndex, 1)
        this.dataObj.groupArr.unshift(updatedGroup)
    }

    async refreshGroups() {
        if (this.dataObj.offline) return

        await this.auth.currentUser.getIdToken(true)
        var tokenInfo = await this.auth.currentUser.getIdTokenResult()
        if (tokenInfo.claims.groups === undefined) return
        var groupIds = Object.keys(tokenInfo.claims.groups)

        var promises = groupIds.map(groupId => {
            return this.firestore.doc('groups/' + groupId).get()
                .then(snapshot => {
                    var groupData = snapshot.data()
                    if (groupId in this.dataObj.groups) {
                        this.dataObj.groups[groupId].name = groupData.name
                    } else {
                        this.dataObj.groups[groupId] = {
                            name: groupData.name
                        }
                    }
                })
        })
        await Promise.all(promises)

        var groupsData = copyOf(this.dataObj.groups)
        for (const groupId in groupsData) {
            groupsData[groupId].messagesObj = undefined
            groupsData[groupId].messagesArr = undefined
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
            groupsData[groupId].messagesObj = undefined
            groupsData[groupId].messagesArr = undefined
        }
        localStorage.setItem('groups', JSON.stringify(groupsData))
    }

    refreshUsers() {
        var userIds = this.getAssociatedUserIds()
        var self = this
        var promises = userIds.map(userId => {
            return this.firestore.doc('users/' + userId).get()
                .then(snapshot => {
                    var userData = snapshot.data()

                    var userObj = {
                        name: userData.name
                    }
                    self.dataObj.users[userId] = userObj
                    localStorage.setItem('user_' + userId, JSON.stringify(userObj))
                })
        })

        return Promise.all(promises)
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

        var listMessageIDs = this.functions.httpsCallable('listMessageIDs')
        var messageIds = await listMessageIDs({groupId: groupId})
        messageIds = messageIds.data.documentIds

        var promises = messageIds.map(messageId => {
            if (
                this.dataObj.groups[groupId].messagesObj !== undefined && 
                messageId in this.dataObj.groups[groupId].messagesObj
            ) {
                messages[messageId] = this.dataObj.groups[groupId].messagesObj[messageId]
                return null
            }

            return this.firestore.doc('groups/' + groupId + '/messages/' + messageId).get()
                .then(snapshot => {
                    var messageData = snapshot.data()
                    messages[messageId] = {
                        from: messageData.from,
                        text: messageData.text,
                        sent: messageData.sent.toDate()
                    }
                })
        })
        await Promise.all(promises)

        this.dataObj.groups[groupId].messagesObj = messages
        localStorage.setItem(groupId + '_messages', JSON.stringify(messages))
    }

    async sendMessage(text, groupId) {
        if (this.dataObj.offline) return
        if (typeof text !== 'string' || text.length <= 0) return
        if (!this.groupExists(groupId)) {
            throw new Error('No group with id ' + groupId)
        }

        var messageObj = {
            from: this.dataObj.uid,
            sent: firebase.firestore.FieldValue.serverTimestamp(),
            text: text
        }

        var arrIndex = this.dataObj.groups[groupId].messagesArr.length
        this.dataObj.groups[groupId].messagesArr.push({
            from: this.dataObj.uid,
            text: text
        })

        var newDoc = await this.firestore.collection('groups/' + groupId + '/messages').add(messageObj)
        
        var now = new Date()
        messageObj.sent = now
        this.dataObj.groups[groupId].messagesObj[newDoc.id] = messageObj
        this.dataObj.groups[groupId].messagesArr[arrIndex].sent = now

        this.newMessageInGroup(groupId)
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
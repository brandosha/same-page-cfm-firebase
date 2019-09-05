var firestore
var functions
var groups = localStorage.getItem('groups')
if (groups === null) {
    groups = { }
    localStorage.setItem('groups', JSON.stringify(groups))
} else {
    groups = JSON.parse(groups)
}

var allMessages = { }
for (const groupId in groups) {
    var messages = localStorage.getItem(groupId + '_messages')
    if (messages === null) {
        messages = { }
        localStorage.setItem(groupId + '_messages', JSON.stringify(messages))
    } else {
        messages = JSON.parse(messages)
        for (const messageId in messages) {
            messages[messageId].sent = new Date(messages[messageId].sent)
        }
    }

    allMessages[groupId] = messages
}

document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            window.location.replace('/sign-up')
        }

        firestore = firebase.firestore()
        functions = firebase.functions()
        functions.useFunctionsEmulator('http://localhost:5001')

        var getGroupIds = functions.httpsCallable('getGroupIds')
        getGroupIds()
        .then(result => {
            var groupIds = result.data.groupIds

            var groupNamePromises = []
            var groupMemberPromises = []

            var getGroupMemberIds = functions.httpsCallable('getGroupMemberIds')
            groupIds.forEach(groupId => {
                groupNamePromises.push(
                    firestore.doc('groups/' + groupId).get()
                )
                groupMemberPromises.push(
                    getGroupMemberIds({groupId: groupId})
                )
            })

            Promise.all(groupNamePromises)
            .then(snapshots => {
                snapshots.forEach(snapshot => {
                    var members = []
                    if (groups[snapshot.id] !== undefined) {
                        members = groups[snapshot.id].members
                    }
                    groups[snapshot.id] = {
                        name: snapshot.data().name,
                        members: members
                    }
                })

                Promise.all(groupMemberPromises)
                .then(results => {
                    results.forEach(result => {
                        var memberIdList = result.data.memberIds
                        var groupId = result.data.input.groupId
                        groups[groupId].members = memberIdList

                        console.log('set member list for ' + groupId + ' to ', memberIdList)
                    })

                    localStorage.setItem('groups', JSON.stringify(groups))
                })

                localStorage.setItem('groups', JSON.stringify(groups))
                loading.hide()
            })

            if (groupIds.length > 0) {
                var currentIndex = 0
                function recursiveMessages(index) {
                    console.log(index)
                    var newMessages = getNewMessages(groupIds[index], _ => {
                        currentIndex++
                        if (currentIndex < groupIds.length) {
                            recursiveMessages(currentIndex)
                        }
                    })
                }
                recursiveMessages(currentIndex)
            }
        })
        .catch(error => {
            console.error(error)
        })
    })
})

function getNewMessages(groupId, finishedCallback) {
    var getMessageIds = functions.httpsCallable('getMessageIds')
    getMessageIds({groupId: groupId})
    .then(result => {
        var messageIds = result.data.messageIds
        var newMessagePromises = []

        var messages = localStorage.getItem(groupId + '_messages')
        if (messages === null) {
            messages = { }
            localStorage.setItem(groupId + '_messages', JSON.stringify(messages))
        } else {
            messages = JSON.parse(messages)
            for (const messageId in messages) {
                messages[messageId].sent = new Date(messages[messageId].sent)
            }
        }

        var localMessageIds = Object.keys(messages)
        messageIds.forEach(messageId => {
            if (messages[messageId] !== undefined) {
                localMessageIds = localMessageIds.filter(id => id !== messageId)
            } else {
                newMessagePromises.push(
                    firestore.doc('groups/' + groupId + '/messages/' + messageId).get()
                )
            }
        })

        localMessageIds.forEach(deletedMessageId => {
            messages[deletedMessageId] = undefined
        });

        var newMessagesPromise = Promise.all(newMessagePromises)
        .then(results => {
            results.forEach((result) => {
                const resultData = result.data()
                messages[result.id] = {
                    from: resultData.from,
                    sent: resultData.sent.toDate(),
                    text: resultData.text
                }
            });

            console.log(messages)
            localStorage.setItem(groupId + '_messages', JSON.stringify(messages))
            allMessages[groupId] = messages
            finishedCallback()
        })
        .catch(error => {
            console.error(error)
        })
    })
    .catch(error => {
        console.error(error)
    })
}

function getUserInfo() {
    
    uniqueArray = a.filter(function(item, index) {
        return a.indexOf(item) == index;
    })
}

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
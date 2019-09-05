const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const firestore = admin.firestore()
const auth = admin.auth()

async function isGroupMember(groupId, auth) {
    var userSnapshot = await firestore.doc('groups/' + groupId + '/members/' + auth.uid).get()
    return userSnapshot.exists === true
}

async function isGroupManager(groupId, auth) {
    var userSnapshot = await firestore.doc('groups/' + groupId + '/members/' + auth.uid).get()
    if(userSnapshot.exists) {
        return userSnapshot.data().isManager === true
    }
    return false
}

exports.searchEmailAddress = functions.https.onCall(async (data, context) => {
    const emailAddr = data.emailAddress
    const groupId = data.groupId

    if (context.auth === undefined) {
        throw new functions.https.HttpsError('permission-denied', 'You must be logged in to complete this action')
    }
    if (emailAddr === undefined || emailAddr === null) {
        throw new functions.https.HttpsError('invalid-argument', 'No email adress was supplied')
    }
    if (groupId === undefined || groupId === null) {
        throw new functions.https.HttpsError('invalid-argument', 'No group id was supplied')
    }

    const permissionToSearch = await isGroupManager(groupId, context.auth)
    if (!permissionToSearch) { 
        throw new functions.https.HttpsError('permission-denied', 'You are not a manger of this group')
    }

    try {
        var userSearch = await auth.getUserByEmail(emailAddr)

        return {
            input: data,
            resultUid: userSearch.uid
        }
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return {
                input: data,
                resultUid: undefined
            }
        }
        throw new functions.https.HttpsError('unknown', error.message)
    }
})

exports.getGroupIds = functions.https.onCall(async (data, context) => {
    var groups = []
    var membersGroup = firestore.collectionGroup('members')

    try {
        var querySnapshot = await membersGroup.where('userId', '==', context.auth.uid).get()
        querySnapshot.forEach(docSnapshot => {
            groups.push(docSnapshot.ref.parent.parent.id)
        })
    } catch(error) {
        throw new functions.https.HttpsError('unknown', error.message)
    }

    return {
        input: data,
        groupIds: groups
    }
})

exports.getMessageIds = functions.https.onCall(async (data, context) => {
    const groupId = data.groupId

    if (context.auth === undefined) {
        throw new functions.https.HttpsError('permission-denied', 'You must be logged in to complete this action')
    }
    if (groupId === undefined || groupId === null) {
        throw new functions.https.HttpsError('invalid-argument', 'No group id was supplied')
    }

    const groupMember = await isGroupMember(groupId, context.auth)
    if (!groupMember) {
        throw new functions.https.HttpsError('permission-denied', 'You are not a member of the group')
    }

    var messages = []
    var messageQuery = await firestore.collection('groups/' + groupId + '/messages').get()
    messageQuery.forEach(result => {
        messages.push(result.id)
    })

    return {
        input: data,
        messageIds: messages
    }
})

exports.getGroupMemberIds = functions.https.onCall(async (data, context) => {
    const groupId = data.groupId

    if (context.auth === undefined) {
        throw new functions.https.HttpsError('permission-denied', 'You must be logged in to complete this action')
    }
    if (groupId === undefined || groupId === null) {
        throw new functions.https.HttpsError('invalid-argument', 'No group id was supplied')
    }

    const groupMember = await isGroupMember(groupId, context.auth)
    if (!groupMember) {
        throw new functions.https.HttpsError('permission-denied', 'You are not a member of the group')
    }

    var members = []
    var messageQuery = await firestore.collection('groups/' + groupId + '/members').get()
    messageQuery.forEach(result => {
        members.push(result.id)
    })

    return {
        input: data,
        memberIds: members
    }
})
const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
    var serviceAccount = require('../.firebase/admin-sdk-credentials.json');
    // initialize app with service credentials here
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Update to your database url if necessary
        databaseURL: "https://same-page-cfm.firebaseio.com"
    });
} catch (error) {
    // no credentials found
    admin.initializeApp()
}

const firestore = admin.firestore()
const auth = admin.auth()

exports.createGroup = functions.https.onCall( async (data, context) => {
    var name = data.name
    var members = data.members

    if (context.auth === undefined) {
        throw new functions.https.HttpsError('permission-denied', 'You must be logged in to complete this action')
    }
    if (name === undefined || name === null || typeof name !== 'string' || (name = name.trim()).length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'No group name was supplied')
    }
    if (members === undefined || members === null) {
        members = []
    }

    var usedMembers = {}
    var uniqueMembers = []
    members.forEach(member => {
        if (usedMembers[member.email] !== true) {
            uniqueMembers.push(member)
            usedMembers[member.email] = true
        }
    })
    members = uniqueMembers

    const newGroup = firestore.collection('groups').doc()
    await newGroup.create({
        name: name
    })

    const membersCollection = newGroup.collection('members')
    membersCollection.doc(context.auth.uid).create({
        manager: true
    })

    var emailPromises = members.map(member => {
        return auth.getUserByEmail(member.email)
            .then(result => {
                return {
                    uid: result.uid,
                    isManager: member.isManager
                }
            })
            .catch(_error => {
                return {
                    email: member.email,
                    uid: null
                }
            })
    })

    var users = await Promise.all(emailPromises)
    var membersObj = { }
    var memberCreationPromises = users.map(user => {
        if (user.uid === null) {
            // TODO send invite email
        } else {
            membersObj[user.uid] = {
                isManager: user.isManager
            }

            return membersCollection.doc(user.uid).create({
                isManager: user.isManager
            })
        }
        return null
    })

    await Promise.all(memberCreationPromises)

    return {
        id: newGroup.id,
        members: membersObj,
        name: name
    }
})

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

exports.updateCustomClaims = functions.firestore
.document('groups/{groupId}/members/{memberId}')
.onWrite( async (change, context) => {
    try {
        var user = await auth.getUser(context.params.memberId)
    } catch (error) {
        console.error(error)
        return
    }
    var claims = user.customClaims
    var userGroups = 
        claims !== undefined && 
        claims.groups !== undefined ? 
        claims.groups : { }
    
    if (change.after.exists) {
        userGroups[context.params.groupId] = {
            isManager: change.after.data.isManager
        }
    } else {
        userGroups[context.params.groupId] = undefined
    }

    try {
        auth.setCustomUserClaims(user.uid, { groups: userGroups })
    } catch (error) {
        console.error(error)
    }
})

exports.listMessageIDs = functions.https.onCall( async (data, context) => {
    const groupId = data.groupId

    if (context.auth === undefined) {
        throw new functions.https.HttpsError('permission-denied', 'You must be logged in to complete this action')
    }
    if (groupId === undefined || groupId === null) {
        throw new functions.https.HttpsError('invalid-argument', 'No group id was supplied')
    }
    
    const groupMember = await isGroupMember(groupId, context.auth)
    if (!groupMember) { 
        throw new functions.https.HttpsError('permission-denied', 'You are not a member of this group')
    }

    var documentIds = []
    var documentRefs = await firestore.collection('groups/' + groupId + '/messages').listDocuments()
    documentRefs.forEach(doc => {
        documentIds.push(doc.id)
    })
    
    return {
        input: data,
        documentIds: documentIds
    }
})

exports.searchEmailAddress = functions.https.onCall( async (data, context) => {
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
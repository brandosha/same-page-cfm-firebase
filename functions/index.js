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
    console.error(error)
    admin.initializeApp()
}

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
    var userGroups = claims.groups !== undefined ? claims.groups : { }
    
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
    console.log(documentIds)
    
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
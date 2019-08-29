const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

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

    var permissionToSearch = false
    var userSnapshot = await admin.firestore().doc('groups/' + groupId + '/members/' + context.auth.uid).get()
    console.log('path: groups/' + groupId + '/members/' + context.auth.uid)
    console.log('Is member of group: ' + userSnapshot.exists)
    if(userSnapshot.exists) {
        console.log(userSnapshot.data())
        permissionToSearch = userSnapshot.data().manager === true
    }

    if (!permissionToSearch) { 
        throw new functions.https.HttpsError('permission-denied', 'You are not a manger of this group')
    }

    try {
        var userSearch = await admin.auth().getUserByEmail(emailAddr)

        return {
            resultUid: userSearch.uid
        }
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return {
                resultUid: undefined
            }
        }
        throw new functions.https.HttpsError('unknown', error.message)
    }
})
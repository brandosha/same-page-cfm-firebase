document.addEventListener('DOMContentLoaded', function() {
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    // // The Firebase SDK is initialized and available here!
    //
    // firebase.auth().onAuthStateChanged(user => { });
    // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
    // firebase.messaging().requestPermission().then(() => { });
    // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
    //
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

    try {
        let app = firebase.app();
        let features = ['auth', 'database', 'messaging', 'storage'].filter(feature => typeof app[feature] === 'function');
        document.getElementById('load').innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;

        var db = firebase.database()

        firebase.functions().useFunctionsEmulator('http://localhost:5001')
        const searchEmailAddress = firebase.functions().httpsCallable('searchEmailAddress')
        searchEmailAddress({groupId: '3krjATsDRvlJ6G6JLxq4', emailAddress: 'b@a.aa'})
            .then(result => {
                console.log(result)
            })
            .catch(error => {
                console.error(error)
            })
    } catch (e) {
        console.error(e);
        document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
    }
});
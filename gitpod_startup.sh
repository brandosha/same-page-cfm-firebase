eval $(gp env -e);
npm install -g firebase-tools;
cd functions;
npm install;
cd ..;
firebase use $FIREBASE_PROJECT_ID;
mkdir '.firebase';
touch '.firebase/admin-sdk-credentials.json';
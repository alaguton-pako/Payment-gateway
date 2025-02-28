import admin from "firebase-admin";

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Fix newlines
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
// This snippet initializes the Firebase Admin SDK with the service account credentials. The service account credentials are loaded from environment variables. The private key is replaced with the actual private key and newlines are fixed. The Firebase Admin SDK is then exported for use in other files. 
//  The Firebase Admin SDK is now initialized with the service account credentials. The service account credentials are loaded from environment variables. The private key is replaced with the actual private key and newlines are fixed. The Firebase Admin SDK is then exported for use in other files. 
//  Step 3: Update the .env File 
//  Update the .env file with the following Firebase service account credentials: 
//  FIREBASE_PROJECT_ID=your-project-id
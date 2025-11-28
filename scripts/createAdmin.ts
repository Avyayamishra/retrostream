import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Initialize (assumes GOOGLE_APPLICATION_CREDENTIALS is set)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function createAdmin(uid: string) {
    try {
        await db.collection('users').doc(uid).set({
            isAdmin: true
        }, { merge: true });
        console.log(`Successfully made user ${uid} an admin.`);
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

const uid = process.argv[2];
if (!uid) {
    console.log('Usage: npm run create-admin <uid>');
    process.exit(1);
}

createAdmin(uid);

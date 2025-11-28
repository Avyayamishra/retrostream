import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

const sampleTracks = [
    {
        id: 'track1',
        title: 'Midnight Jazz',
        artist: 'Retro Band',
        duration: 180,
        storagePath: 'tracks/sample/midnight.mp3', // Placeholder
        coverPath: 'https://via.placeholder.com/300/8A6B46/FFFFFF?text=Jazz',
        createdAt: Date.now(),
        plays: 1200,
        uploadedBy: 'system'
    },
    {
        id: 'track2',
        title: 'Lo-Fi Study',
        artist: 'Chill Beats',
        duration: 240,
        storagePath: 'tracks/sample/lofi.mp3',
        coverPath: 'https://via.placeholder.com/300/4A7A73/FFFFFF?text=LoFi',
        createdAt: Date.now(),
        plays: 850,
        uploadedBy: 'system'
    }
];

async function seed() {
    for (const track of sampleTracks) {
        await db.collection('tracks').doc(track.id).set(track);
    }
    console.log('Seeded sample tracks');
}

seed();

const { v4: uuidv4 } = require('uuid');
const bucket = require('../config/firebase');

async function uploadAudioToFirebase(fileBuffer, originalName, mimetype) {
  const fileName = `${uuidv4()}_${originalName}`;
  const file = bucket.file(fileName);

  const stream = file.createWriteStream({
    metadata: {
      contentType: mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', async () => {
      await file.makePublic(); // اجعل الملف متاحًا للجميع
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      resolve(publicUrl);
    });
    stream.end(fileBuffer);
  });
}

module.exports = uploadAudioToFirebase;

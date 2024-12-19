import mongoose from "mongoose";
import multer from "multer";
import { GridFSBucket } from "mongodb";

let conn;
let gfsBucket;
const storage = multer.memoryStorage();
const upload = multer({ storage });
let mongoURI;

let InitializeGridFS = (mongoUrl,collectionName) =>{
  mongoURI = mongoUrl; // Replace with your MongoDB URI
  // Connect to MongoDB
mongoose.connect(mongoURI,{
  useNewUrlParser: true,
    useUnifiedTopology: true,
});
conn = mongoose.connection;

conn.once('open', () => {
  gfsBucket = new GridFSBucket(conn.db, {
    bucketName: collectionName, // Collection name where files will be stored
  });
  console.log('Connected to MongoDB and GridFS!');
});
}

let returnUploadArray = (filesName,fileLength) => {
  return upload.array(filesName,fileLength)
}

const uploadFilesApi =  async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
  
      const uploadedFiles = [];
  
      // Stream each file to GridFS
      for (const file of req.files) {
        const writeStream = gfsBucket.openUploadStream(file.originalname, {
          contentType: file.mimetype, // Store MIME type of the file
        });
        writeStream.end(file.buffer);
  
        await new Promise((resolve, reject) => {
          writeStream.on('finish', () => {
            uploadedFiles.push({ filename: file.originalname, fileId: writeStream.id, link:req.headers.host+req.url.slice(7)+"/"+file.originalname });
            resolve();
          });
          writeStream.on('error', (err) => reject(err));
        });
      }
  
      res.status(201).json({
        message: 'Files uploaded successfully',
        files: uploadedFiles,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

const findFileByName = async (req, res) => {
  try {
    const file = await gfsBucket
      .find({ filename: req.params.filename })
      .toArray()
      .then((files) => files[0]);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Stream the file to the response
    res.set('Content-Type', file.contentType);
    gfsBucket.openDownloadStream(file._id).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
}

const GridFSVideos = {
  init:InitializeGridFS,
  nameAndLimit:returnUploadArray,
  uploadFilesApi:uploadFilesApi,
  findFileByName:findFileByName
}

export default GridFSVideos;
import express from "express";
import GridFSVideos  from "./gridFSVideos.js";
import GridFSImages  from "./gridFSImages.js";
import dotenv from "dotenv";
dotenv.config()

const mongoUrl = process.env.MONGO_URL;
const PORT = process.env.PORT;

GridFSImages.init(mongoUrl,"myimages")
GridFSVideos.init(mongoUrl,"myvideos")

const app = express();

app.post('/upload/images',GridFSImages.nameAndLimit("images",100),GridFSImages.uploadFilesApi);
app.get('/images/:filename',GridFSImages.findFileByName);

app.post('/upload/videos',GridFSVideos.nameAndLimit("videos",100),GridFSVideos.uploadFilesApi);
app.get('/videos/:filename',GridFSVideos.findFileByName);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
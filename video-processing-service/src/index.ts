import express, { Request, Response } from "express";
import {
  convertVideo,
  deleteProcessedVideo,
  deleteRawVideo,
  downloadRawVideo,
  setupDirectories,
  uploadProcessedVideo
} from "./storage";

setupDirectories();

const app = express();
app.use(express.json());

app.post("/process-video", async (req: Request, res: Response): Promise<void> => {
  // Get the bucket and filename from the Cloud Pub/Sub message
  let data;

  // Try to extract the filename from the Cloud Pub/Sub message payload
  try {
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
    data = JSON.parse(message);
    if (!data.name) {
      throw new Error('Invalid message payload received.');
    }
  } catch (error) {
    console.log(error);
    res.status(400).send('Bad Request: missing filename.');
    return;
  }

  const inputFileName = data.name;
  const outputFileName = `processed-${inputFileName}`;

  // Download the raw video from Cloud Storage
  await downloadRawVideo(inputFileName);

  // Convert the video to 360P
  try {
    await convertVideo(inputFileName, outputFileName);
  } catch (err) {
    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName),
    ]);
    console.log(err);
    res.status(500).send(`Internal Server Error: video processing failed.`);
    return;
  }

  // Upload the processed video to Cloud Storage 
  await uploadProcessedVideo(outputFileName);

  await Promise.all([
    deleteRawVideo(inputFileName),
    deleteProcessedVideo(outputFileName),
  ]);

  res.status(200).send("Processing finished successfully.");
  return;
});


const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(
    `Video processing service listening at http://localhost:${port}`
  );
});

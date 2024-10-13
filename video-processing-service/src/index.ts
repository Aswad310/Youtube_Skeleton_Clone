import express, { Request, Response } from "express"; // Import Request and Response types

import ffmpeg from "fluent-ffmpeg";

const app = express();
app.use(express.json());

app.post("/process-video", (req: Request, res: Response): void => {

  // Get the path of the input video file from the request body
  const inputFilePath = req.body.inputFilePath;
  const outputFilePath = req.body.outputFilePath;

  // Check if the input file path is defined
  if (!inputFilePath || !outputFilePath) {
    res.status(400).send("Bad request: Missing file path.");
    return;
  }

  // Create the ffmpeg command
  ffmpeg(inputFilePath)
    .outputOptions("-vf", "scale=-1:360") // 360P
    .on("end", () => {
      console.log("Processing finished successfully.");
      res.status(200).send("Processing finished successfully.")
    })
    .on("error", (err) => {
      console.log(`An error occurred: ${err.message}`);
      res.status(500).send(`Internal Server Error: ${err.message}`);
    })
    .save(outputFilePath);
});


const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(
    `Video processing service listening at http://localhost:${port}`
  );
});

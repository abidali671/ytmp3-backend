const express = require("express");
const app = express();
const http = require("http").Server(app);
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const requestIp = require("request-ip");
const tempDir = path.join(__dirname, "temp");
const geoip = require("geoip-lite");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userController = require("./controller/user.controller");
const languageController = require("./controller/language.controller");
const settingController = require("./controller/setting.controller");
const PageController = require("./controller/page.controller");
const RewriteController = require("./controller/rewrite.controller");
const RedirectController = require("./controller/redirect.controller");
const FileController = require("./controller/file.controller");
const Authenticate = require("./middleware/authenticate.middleware");
const FileUpload = require("./middleware/file_upload.middleware");
const { Innertube } = require("youtubei.js");
const ytdl = require("@distube/ytdl-core");
const got = require("got");
const { exec } = require("child_process");
const jwt = require("jsonwebtoken");
const innerTubeSettings = {
  generate_session_locally: true,
  po_token:
    "MnT2lMYFNJ2fzPas0KjT1mFSY2cH5XbLOcmSIir3RFHs11fGplD4XusFTcPt4nbIILAdNkpUGqSQJR4P4lr5wGGJXIonUxQWzSWl1onEYW-3FkKGp11dkWhe2Fk1hWBkMfLxnrjgmLDM_JrpUUaytydopzI9sQ==",
  visitor_data: "CgtqaU1abDhOY2pIZyjt8Yy2BjIKCgJKUBIEGgAgCw%3D%3D",
};

dotenv.config();

if (!fs.existsSync(tempDir)) {
  try {
    fs.mkdir(tempDir, () => {});
  } catch (err) {
    console.error(`Error creating directory: ${err.message}`);
  }
}

app.use(requestIp.mw());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
const PORT = 9015;

app.use((req, res, next) => {
  const ip = req.clientIp;
  const geo = geoip.lookup(ip);
  const country = geo ? geo.country : "Unknown";
  req.clientCountry = country;
  next();
});

app.get("/", async (req, res) => {
  try {
    const { videoId } = req.query;

    if (!videoId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    const info = await getVideoInfo(videoId);
    res.json(info);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/search", async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: "Missing keyword parameter" });
    }
    const sanitizedKeyword = keyword.replace(/\s+/g, "");

    const innerTube = await Innertube.create(innerTubeSettings);
    const search = await innerTube.search(sanitizedKeyword);
    search.results.shift();

    const videos = search.results
      .filter((item) => item?.id)
      .map((item) => ({
        title: item?.title?.text,
        videoId: item.id,
        thumbnail: item?.thumbnails?.[0]?.url,
        videoUrl: "https://www.youtube.com" + item?.endpoint?.metadata?.url,
      }));

    res.json({ videos });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "An error occurred" });
  }
});

async function getVideoInfo(videoId) {
  const innerTube = await Innertube.create(innerTubeSettings);
  const info = await innerTube.getBasicInfo(videoId);

  const formatInfo = {
    title: info?.basic_info?.title,
    thumbnail: getHighestThumbnail(info?.basic_info.thumbnail),
    duration: formatDuration(info?.basic_info.duration),
  };

  return formatInfo;
}

function getHighestThumbnail(thumbnails) {
  if (!thumbnails || thumbnails.length === 0) {
    return null;
  }

  const thumbnail = thumbnails.reduce((prev, current) =>
    prev.height > current.height ? prev : current
  );

  return thumbnail.url;
}

function formatDuration(durationInSeconds) {
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const printBoxedLog = (message) => {
  const boxWidth = 60;
  const horizontalLine = "-".repeat(boxWidth);
  const emptyLine = "|" + " ".repeat(boxWidth - 2) + "|";

  const now = new Date();
  const dateTime = now.toLocaleString();

  const fullMessage = `[${dateTime}]\n${message}`;
  const wrappedMessage = fullMessage
    .match(new RegExp(".{1," + (boxWidth - 4) + "}", "g"))
    .map((line) => {
      const padding = boxWidth - 2 - line.length;
      return "|" + line + " ".repeat(padding) + "|";
    })
    .join("\n");

  console.log(horizontalLine);
  console.log(emptyLine);
  console.log(wrappedMessage);
  console.log(emptyLine);
  console.log(horizontalLine);
};

// Example usage:
printBoxedLog(
  "This is a test message to demonstrate the boxed log with date and time."
);

app.get("/download/:token", (req, res) => {
  try {
    const clientCountry = req.clientCountry;
    const decodedPayload = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const streamUrl = atob(decodedPayload.streamUrl);

    const downloadStream = got.stream(streamUrl);

    downloadStream.on("error", (error) => {
      console.error(`Error downloading stream: ${error}`);

      res.redirect(`https://${process.env.WEBSITE_DOMAIN}`);
    });

    console.log(
      `${borderLine}\nDownload Stream URL: ${streamUrl}\nPort: ${PORT}\nVideo Title: ${decodedPayload.title}\nCountry: ${clientCountry}\n${borderLine}`
    );

    downloadStream.pipe(res);
  } catch (error) {
    res.redirect(`https://${process.env.WEBSITE_DOMAIN}`);
  }
});

const borderLine =
  "\x1b[34;1;4m----------------------------------------\x1b[0m";
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
io.on("connection", function (socket) {
  socket.on("startProcessing", async (data) => {
    try {
      const { url, isAudioOnly, title } = JSON.parse(data);

      got
        .post("https://api.sssyoutube.net/api/json", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          json: {
            url,
            isAudioOnly,
            filenamePattern: "basic",
          },
          responseType: "json",
          throwHttpErrors: false,
        })
        .then((cobaltResponse) => {
          const borderLine =
            "\x1b[34;1;4m----------------------------------------\x1b[0m";
          console.log(`${borderLine}`);
          console.log(`User connected: ${socket.id}`);
          console.log(`Request Count: 1`);
          console.log(`Video URL: ${url}`);
          console.log(`Cobalt API Response Code: ${cobaltResponse.statusCode}`);
          console.log(
            `Rate Limit Remaining: ${cobaltResponse.headers["ratelimit-remaining"]}`
          );

          if (cobaltResponse.statusCode !== 200) {
            console.log(
              `Cobalt Response: ${JSON.stringify(cobaltResponse.body)}`
            );
            io.to(socket.id).emit(
              "error",
              "Something went wrong. Please try again later."
            );
            return;
          }

          const streamUrl = cobaltResponse.body.url;

          console.log(
            "Successfully obtained video information and generated JWT token"
          );

          const expiryTime = 15;
          const expirationTime =
            Math.floor(Date.now() / 1000) + 60 * expiryTime;
          const token = jwt.sign(
            {
              title,
              streamUrl: btoa(streamUrl),
              exp: expirationTime,
            },
            process.env.JWT_SECRET,
            { algorithm: "HS256" }
          );

          io.to(socket.id).emit("Complete", token);
          socket.disconnect();
        });
    } catch (error) {
      console.log(error);
      io.to(socket.id).emit(
        "error",
        "Something went wrong. Please try again later."
      );
    }
  });
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.post("/api/build", (_, res) => {
  const frontendPath = path.resolve(__dirname, "../frontend");
  exec("npm run build", { cwd: frontendPath }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      res.status(500).json({ error: error.message });
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      res.status(500).json({ error: stderr });
      return;
    }
    res.status(200).json({
      message: "Build process completed successfully",
      output: stdout,
    });
  });
});

app.post("/api/user/login", userController.login);
app.get("/api/user/me", Authenticate, userController.me);
app.patch("/api/user/update", Authenticate, userController.update);

app.post("/api/language/create", Authenticate, languageController.addLanguage);
app.patch(
  "/api/language/update",
  Authenticate,
  languageController.updateLanguage
);
app.get("/api/all-language", languageController.getAllLanguages);
app.get("/api/language", languageController.getLanguages);

app.post("/api/setting", Authenticate, settingController.createSetting);
app.patch("/api/setting", Authenticate, settingController.editSetting);
app.get("/api/setting", settingController.getSetting);

app.get("/api/page/:type/slug", PageController.getPageSlug);
app.post("/api/page", Authenticate, PageController.createPage);
app.patch("/api/page/:type/:code", Authenticate, PageController.editPage);
app.get("/api/page/:type/:code", PageController.getPage);

app.post("/api/rewrite", RewriteController);

app.get("/api/redirect", RedirectController.getRedirects);
app.post("/api/redirect", Authenticate, RedirectController.createRedirect);
app.patch("/api/redirect/:id", Authenticate, RedirectController.editRedirect);
app.delete(
  "/api/redirect/:id",
  Authenticate,
  RedirectController.deleteRedirect
);

app.post("/api/file", FileUpload.single("file"), FileController.createFile);
app.get("/api/file", FileController.getFiles);
app.delete("/api/file", FileController.deleteFile);
app.use("/media", express.static(path.join(__dirname, "media")));

http.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await mongoose.connect(process.env.MONGO_DB_URI);
  console.log("DB connected");
});

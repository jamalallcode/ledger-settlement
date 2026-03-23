import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || "ocr-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: true,
      sameSite: 'none',
      httpOnly: true
    }
  }));

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/auth/callback`
  );

  // Auth Routes
  app.get("/api/auth/google/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/documents.readonly"
      ],
      prompt: "consent"
    });
    res.json({ url });
  });

  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      (req.session as any).tokens = tokens;
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/google/status", (req, res) => {
    res.json({ isAuthenticated: !!(req.session as any).tokens });
  });

  app.post("/api/ocr/google-docs", async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { image, mimeType } = req.body;
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const docs = google.docs({ version: "v1", auth: oauth2Client });

    try {
      // 1. Upload image to Drive with OCR
      const fileMetadata = {
        name: `OCR_Temp_${Date.now()}`,
        mimeType: "application/vnd.google-apps.document",
      };
      
      const media = {
        mimeType: mimeType,
        body: Buffer.from(image, 'base64'),
      };

      const driveFile = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id",
      });

      const fileId = driveFile.data.id;

      // 2. Get content from the created Google Doc
      const doc = await docs.documents.get({
        documentId: fileId!,
      });

      let text = "";
      doc.data.body?.content?.forEach(element => {
        if (element.paragraph) {
          element.paragraph.elements?.forEach(el => {
            if (el.textRun) {
              text += el.textRun.content;
            }
          });
        }
      });

      // 3. Delete the temporary file
      await drive.files.delete({ fileId: fileId! });

      res.json({ text });
    } catch (error) {
      console.error("Google OCR Error:", error);
      res.status(500).json({ error: "Google Docs OCR failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

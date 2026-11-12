import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  downloadMediaMessage,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';

type DocumentHandler = (doc: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  sender: string;
  groupJid?: string;
  caption?: string;
}) => Promise<void>;

class WhatsAppService {
  private sock: any = null;
  private status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private qrCodeDataUrl: string | null = null;
  private connectedUser: string | null = null;
  private lastSyncTime: string | null = null;
  private documentHandler: DocumentHandler | null = null;
  private sessionDir: string;
  private isInitializing: boolean = false;

  constructor() {
    this.sessionDir = path.join(process.cwd(), 'whatsapp_session');
    if (!fs.existsSync(this.sessionDir)) {
      try {
        fs.mkdirSync(this.sessionDir, { recursive: true });
      } catch (e) {}
    }
  }

  public setDocumentHandler(handler: DocumentHandler) {
    this.documentHandler = handler;
  }

  public getStatus() {
    return {
      status: this.status,
      qrCodeDataUrl: this.qrCodeDataUrl,
      connectedUser: this.connectedUser,
      lastSyncTime: this.lastSyncTime
    };
  }

  public async connect(): Promise<void> {
    if (this.status === 'connected' || this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    this.status = 'connecting';

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
      const { version } = await fetchLatestBaileysVersion();

      const logger = pino({ level: 'silent' });

      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: ['Audit Ledger System', 'Chrome', '1.0.0'],
        generateHighQualityLinkPreview: false,
        syncFullHistory: false
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, {
              scale: 6,
              margin: 2,
              color: { dark: '#0f172a', light: '#ffffff' }
            });
            this.status = 'connecting';
          } catch (qrErr) {
            console.error('[WhatsApp Service] QR Generation Error:', qrErr);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          this.status = 'disconnected';
          this.qrCodeDataUrl = null;
          this.connectedUser = null;
          this.isInitializing = false;

          console.log(`[WhatsApp Service] Connection closed. Reason: ${statusCode}. Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect) {
            setTimeout(() => this.connect(), 4000);
          }
        } else if (connection === 'open') {
          this.status = 'connected';
          this.qrCodeDataUrl = null;
          this.connectedUser = this.sock?.user?.name || this.sock?.user?.id || 'Connected User';
          this.lastSyncTime = new Date().toISOString();
          this.isInitializing = false;
          console.log('[WhatsApp Service] Connection successfully established!');
        }
      });

      // Listen for incoming messages in all groups and chats
      this.sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
        if (!messages || !Array.isArray(messages)) return;

        for (const msg of messages) {
          try {
            if (!msg.message || msg.key.fromMe) continue;

            const isGroup = Boolean(msg.key.remoteJid && msg.key.remoteJid.endsWith('@g.us'));
            const senderJid = msg.key.participant || msg.key.remoteJid;

            // Check if message has a document or image attachment
            const docMsg = 
              msg.message.documentMessage || 
              msg.message.documentWithCaptionMessage?.message?.documentMessage;
            const imgMsg = msg.message.imageMessage;

            if (docMsg || imgMsg) {
              const fileName = 
                docMsg?.fileName || 
                (imgMsg ? `circular_image_${Date.now()}.jpg` : `circular_doc_${Date.now()}.pdf`);
              
              const mimeType = 
                docMsg?.mimetype || 
                (imgMsg ? 'image/jpeg' : 'application/pdf');

              const caption = 
                docMsg?.caption || 
                imgMsg?.caption || 
                msg.message.conversation || 
                '';

              console.log(`[WhatsApp Service] Detected document from ${isGroup ? 'Group ' + msg.key.remoteJid : senderJid}: ${fileName}`);

              // Download media buffer
              const buffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                {
                  logger: pino({ level: 'silent' }),
                  reuploadRequest: this.sock.updateMediaMessage
                }
              );

              if (buffer && this.documentHandler) {
                this.lastSyncTime = new Date().toISOString();
                await this.documentHandler({
                  buffer: Buffer.from(buffer),
                  fileName,
                  mimeType,
                  sender: isGroup ? 'WhatsApp গ্রুপ' : 'WhatsApp মেসেজ',
                  groupJid: isGroup ? msg.key.remoteJid : undefined,
                  caption
                });
              }
            }
          } catch (msgErr) {
            console.error('[WhatsApp Service] Error processing incoming message:', msgErr);
          }
        }
      });

    } catch (err) {
      console.error('[WhatsApp Service] Connection setup error:', err);
      this.status = 'disconnected';
      this.isInitializing = false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout();
        this.sock = null;
      }
      this.status = 'disconnected';
      this.qrCodeDataUrl = null;
      this.connectedUser = null;
      this.isInitializing = false;

      // Clean session directory
      if (fs.existsSync(this.sessionDir)) {
        try {
          fs.rmSync(this.sessionDir, { recursive: true, force: true });
          fs.mkdirSync(this.sessionDir, { recursive: true });
        } catch (e) {}
      }
    } catch (e) {
      console.error('[WhatsApp Service] Disconnect error:', e);
    }
  }
}

export const whatsappService = new WhatsAppService();

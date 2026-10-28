import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { success } from '../../lib/response.js';
import { BadRequestError } from '../../lib/errors.js';
import config from '../../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, '../../../public/uploads');

const ALLOWED_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

export async function uploadImage(req, res) {
  const { image, folder = 'general', filename } = req.body || {};

  if (!image || typeof image !== 'string') {
    throw new BadRequestError('image data is required (data URL or base64)');
  }

  // Parse Data URL format: data:image/png;base64,...
  let mimeType = 'image/png';
  let base64Data = image;

  const matches = image.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
  if (matches) {
    mimeType = matches[1].toLowerCase();
    base64Data = matches[2];
  }

  if (!ALLOWED_MIME[mimeType]) {
    throw new BadRequestError(`Unsupported image format: ${mimeType}. Allowed: JPEG, PNG, WEBP, GIF, SVG.`);
  }

  const ext = ALLOWED_MIME[mimeType];
  const buffer = Buffer.from(base64Data, 'base64');

  // Max 5MB
  if (buffer.length > 5 * 1024 * 1024) {
    throw new BadRequestError('Image size exceeds 5MB limit');
  }

  const cleanFolder = ['categories', 'brands', 'products', 'cms'].includes(folder) ? folder : 'general';
  const targetDir = path.join(UPLOADS_ROOT, cleanFolder);
  await fs.mkdir(targetDir, { recursive: true });

  const safeBaseName = filename
    ? path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
    : 'upload';
  const finalFileName = `${Date.now()}_${safeBaseName}${ext}`;
  const filePath = path.join(targetDir, finalFileName);

  await fs.writeFile(filePath, buffer);

  const baseUrl = (config.appBaseUrl || 'http://localhost:4000').replace(/\/$/, '');
  const publicUrl = `${baseUrl}/uploads/${cleanFolder}/${finalFileName}`;

  return success(res, {
    url: publicUrl,
    filename: finalFileName,
    folder: cleanFolder,
    size: buffer.length,
    mime_type: mimeType,
  }, 201);
}

export default { uploadImage };

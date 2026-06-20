import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@/core/config/env';
import { authenticate } from '@/shared/middlewares/authenticate';
import { ValidationError } from '@/shared/errors';

const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT || undefined,
  region: env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

router.post(
  '/',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const file = req.file;
      const extension = file.originalname.split('.').pop() || 'png';
      const bucketName = env.S3_BUCKET || 'blood-bank';

      let folder = (req.query.folder as string) || '';
      // Sanitize folder to be safe (alphanumeric, hyphens, and slashes allowed for subfolders)
      folder = folder.replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/^\/|\/$/g, '');

      const d = new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const dateStr = `${day}-${month}-${year}`;

      const prefix = folder || 'upload';
      const filename = `${prefix}-${dateStr}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
      const key = folder ? `${folder}/${filename}` : filename;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      const fileUrl = `${env.S3_PUBLIC_URL}/${key}`;
      res.json({
        success: true,
        data: {
          filename,
          url: fileUrl,
        },
      });
    } catch (e: any) {
      next(e);
    }
  }
);

router.delete(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fileUrl = req.query.url as string;
      if (!fileUrl) {
        throw new ValidationError('url query parameter is required');
      }

      const publicUrl = env.S3_PUBLIC_URL;
      if (!fileUrl.startsWith(publicUrl)) {
        throw new ValidationError('Invalid file URL');
      }

      const key = fileUrl.replace(`${publicUrl}/`, '');
      const bucketName = env.S3_BUCKET || 'blood-bank';

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );

      res.json({
        success: true,
        message: 'File deleted from S3 successfully',
      });
    } catch (e: any) {
      next(e);
    }
  }
);

export default router;

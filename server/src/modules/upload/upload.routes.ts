import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { env } from '@/core/config/env';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { ROLE } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';
import { ValidateUpload } from '@/modules/upload/upload.validator';

// A hung/unreachable S3 endpoint must fail fast with a clear error rather
// than hang until the client's own axios timeout fires — short connection
// timeout, one retry, and a short-ish request timeout.
const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT || undefined,
  region: env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
  maxAttempts: 2,
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 5_000,
    requestTimeout: 10_000,
  }),
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
  requirePermission('upload:write'),
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const file = req.file;
      const extension = file.originalname.split('.').pop() || 'png';
      const bucketName = env.S3_BUCKET || 'blood-bank';

      // Sanitized (alphanumeric, hyphens, and slashes for subfolders) by the validator.
      const { folder } = ValidateUpload.uploadQuery(req);

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
  requirePermission('upload:write'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url: fileUrl } = ValidateUpload.deleteQuery(req);

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

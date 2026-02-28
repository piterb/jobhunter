import { Router, Response } from 'express';
import multer from 'multer';
import sql from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { UpdateProfileSchema, UpdateProfileRequest } from 'shared';
import { storage, BUCKETS } from '../config/storage';
import path from 'path';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /profile - Get user profile
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [profile] = await sql`
            SELECT * FROM profiles 
            WHERE id = ${userId}
        `;

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        return res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /profile - Update user profile
router.put('/', validate(UpdateProfileSchema), async (req: AuthRequest<{}, {}, UpdateProfileRequest>, res: Response) => {
    const userId = req.user?.id;
    const updates = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [profile] = await sql`
            UPDATE profiles 
            SET ${sql(updates)}
            WHERE id = ${userId}
            RETURNING *
        `;

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        return res.json(profile);
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /profile/documents - Get user documents
router.get('/documents', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const documents = await sql`
            SELECT * FROM documents 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
        `;
        return res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /profile/documents - Upload document
router.post('/documents', upload.single('file'), async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const file = req.file;
    const { doc_type, is_primary } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const filePath = `${userId}/${fileName}`;

    try {
        // 1. Upload to GCS
        await storage.bucket(BUCKETS.DOCUMENTS).file(filePath).save(file.buffer, {
            contentType: file.mimetype,
            metadata: {
                user_id: userId
            }
        });

        // 2. Insert into DB
        const [document] = await sql`
            INSERT INTO documents (user_id, name, storage_path, doc_type, is_primary)
            VALUES (${userId}, ${file.originalname}, ${filePath}, ${doc_type || 'Resume'}, ${is_primary === 'true'})
            RETURNING *
        `;

        return res.status(201).json(document);
    } catch (error) {
        console.error('Error uploading document:', error);
        return res.status(500).json({ error: 'Failed to upload document' });
    }
});

// DELETE /profile/documents/:id - Delete document
router.delete('/documents/:id', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [doc] = await sql`
            SELECT storage_path FROM documents 
            WHERE id = ${id} AND user_id = ${userId}
        `;

        if (!doc) return res.status(404).json({ error: 'Document not found' });

        // 1. Delete from GCS
        try {
            await storage.bucket(BUCKETS.DOCUMENTS).file(doc.storage_path).delete();
        } catch (gcsError) {
            console.warn('File might not exist in GCS, continuing deletion from DB', gcsError);
        }

        // 2. Delete from DB
        await sql`
            DELETE FROM documents 
            WHERE id = ${id} AND user_id = ${userId}
        `;

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting document:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /profile/avatar - Upload avatar
router.post('/avatar', upload.single('file'), async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileExt = path.extname(file.originalname) || '.png';
    const fileName = `avatar_${Date.now()}${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    try {
        // 1. Upload to GCS
        const gcsFile = storage.bucket(BUCKETS.AVATARS).file(filePath);
        const isLocal = process.env.NODE_ENV === 'development';

        await gcsFile.save(file.buffer, {
            contentType: file.mimetype,
            resumable: false,
            metadata: {
                contentType: file.mimetype,
                contentDisposition: 'inline',
            }
        });

        const gcsEndpoint = process.env.GCS_ENDPOINT || 'http://127.0.0.1:4443';
        const publicUrl = isLocal
            ? `${gcsEndpoint}/download/storage/v1/b/${BUCKETS.AVATARS}/o/${encodeURIComponent(filePath)}?alt=media`
            : `https://storage.googleapis.com/${BUCKETS.AVATARS}/${filePath}`;

        // 2. Update Profile
        const [profile] = await sql`
            UPDATE profiles 
            SET avatar_url = ${publicUrl}, updated_at = NOW() 
            WHERE id = ${userId}
            RETURNING avatar_url
        `;

        return res.json({ avatar_url: profile.avatar_url });
    } catch (error: unknown) {
        console.error('Error uploading avatar:', error);
        return res.status(500).json({
            error: 'Failed to upload avatar',
            details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
        });
    }
});

// GET /profile/documents/:id/download - Download document
router.get('/documents/:id/download', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [doc] = await sql`
            SELECT name, storage_path FROM documents 
            WHERE id = ${id} AND user_id = ${userId}
        `;

        if (!doc) return res.status(404).json({ error: 'Document not found' });

        const file = storage.bucket(BUCKETS.DOCUMENTS).file(doc.storage_path);
        const [exists] = await file.exists();
        if (!exists) return res.status(404).json({ error: 'File not found in storage' });

        res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
        file.createReadStream().pipe(res);
    } catch (error) {
        console.error('Error downloading document:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

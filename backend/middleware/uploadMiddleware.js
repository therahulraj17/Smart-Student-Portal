const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ApiError } = require('./errorMiddleware');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ─── Storage Engine ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads', req.uploadFolder || 'general');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, safeName);
  },
});

// ─── File Filter Factories ────────────────────────────────────────────────────
const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|zip|rar/;
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
  ];
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedMimes.includes(file.mimetype);

  if (extOk && mimeOk) cb(null, true);
  else cb(new ApiError('Only document files are allowed (PDF, DOC, DOCX, TXT, ZIP)', 400));
};

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|gif|webp/;
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedMimes.includes(file.mimetype);

  if (extOk && mimeOk) cb(null, true);
  else cb(new ApiError('Only image files are allowed (JPG, PNG, GIF, WEBP)', 400));
};

const anyFilter = (req, file, cb) => {
  const blockedMimes = ['application/x-executable', 'application/x-sh', 'text/html'];
  if (blockedMimes.includes(file.mimetype)) {
    cb(new ApiError('This file type is not allowed', 400));
  } else {
    cb(null, true);
  }
};

// ─── Multer Instances ─────────────────────────────────────────────────────────
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

const uploadDocument = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: documentFilter,
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for images
  fileFilter: imageFilter,
});

const uploadAny = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: anyFilter,
});

// ─── Folder setter middleware ─────────────────────────────────────────────────
const setUploadFolder = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  next();
};

module.exports = { uploadDocument, uploadImage, uploadAny, setUploadFolder };

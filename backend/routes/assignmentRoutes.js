const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, assignmentSchema, gradeSubmissionSchema } = require('../utils/validators');
const { uploadDocument, setUploadFolder } = require('../middleware/uploadMiddleware');

router.use(protect);

router.route('/')
  .get(ctrl.getAssignments)
  .post(authorize('teacher', 'admin'), setUploadFolder('assignments'), uploadDocument.array('attachments', 5), validate(assignmentSchema), ctrl.createAssignment);

router.route('/:id')
  .get(ctrl.getAssignment)
  .put(authorize('teacher', 'admin'), ctrl.updateAssignment)
  .delete(authorize('teacher', 'admin'), ctrl.deleteAssignment);

router.post('/:id/submit', authorize('student'),
  setUploadFolder('submissions'), uploadDocument.array('files', 3), ctrl.submitAssignment);

router.put('/:id/submissions/:submissionId/grade',
  authorize('teacher', 'admin'), validate(gradeSubmissionSchema), ctrl.gradeSubmission);

router.post('/:id/submissions/:submissionId/plagiarism',
  authorize('teacher', 'admin'), ctrl.checkPlagiarism);

module.exports = router;

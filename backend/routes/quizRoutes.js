const express = require('express');
const router = express.Router();
const quizCtrl = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, quizSchema } = require('../utils/validators');

router.use(protect);
router.route('/').get(quizCtrl.getQuizzes).post(authorize('teacher', 'admin'), validate(quizSchema), quizCtrl.createQuiz);
router.route('/:id').get(quizCtrl.getQuiz).put(authorize('teacher', 'admin'), quizCtrl.updateQuiz).delete(authorize('teacher', 'admin'), quizCtrl.deleteQuiz);
router.post('/:id/attempt', authorize('student'), quizCtrl.startAttempt);
router.post('/:id/attempt/:attemptId/submit', authorize('student'), quizCtrl.submitAttempt);
module.exports = router;

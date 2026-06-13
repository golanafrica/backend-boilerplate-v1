import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { isAdmin } from '../middlewares/isAdmin';
import { userController } from '../controllers/userController';

const router = Router();

// Toutes les routes nécessitent authentification + rôle ADMIN
router.use(auth);
router.use(isAdmin);

/**
 * @route   GET /api/v1/users
 * @desc    Récupérer la liste des utilisateurs (pagination)
 * @access  Admin
 * @query   page (default: 1), limit (default: 10, max: 100)
 */
router.get('/', userController.getAllUsers.bind(userController));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Récupérer un utilisateur par ID
 * @access  Admin
 */
router.get('/:id', userController.getUserById.bind(userController));

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Admin
 */
router.delete('/:id', userController.deleteUser.bind(userController));

/**
 * @route   PATCH /api/v1/users/:id/role
 * @desc    Mettre à jour le rôle d'un utilisateur
 * @access  Admin
 * @body    { role: "USER" | "ADMIN" }
 */
router.patch('/:id/role', userController.updateUserRole.bind(userController));

export default router;
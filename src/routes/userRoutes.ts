import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { isAdmin } from '../middlewares/isAdmin';
import { userController } from '../controllers/userController';

const router = Router();

// Toutes les routes nécessitent authentification + rôle ADMIN
router.use(auth);
router.use(isAdmin);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Récupérer la liste paginée des utilisateurs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle ADMIN requis)
 */
router.get('/', userController.getAllUsers.bind(userController));

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Récupérer les détails d'un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle ADMIN requis)
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', userController.getUserById.bind(userController));

/**
 * @swagger
 * /api/v1/users/{id}/role:
 *   patch:
 *     summary: Changer le rôle d'un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 example: ADMIN
 *     responses:
 *       200:
 *         description: Rôle mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Rôle mis à jour avec succès
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle ADMIN requis)
 *       404:
 *         description: Utilisateur non trouvé
 */
router.patch('/:id/role', userController.updateUserRole.bind(userController));

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Utilisateur supprimé avec succès
 *       400:
 *         description: Impossible de supprimer son propre compte
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle ADMIN requis)
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete('/:id', userController.deleteUser.bind(userController));

export default router;
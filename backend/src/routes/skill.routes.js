import express from 'express';
import { listarSkills } from '../controllers/skill.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const skillRouter = express.Router();

skillRouter.get('/', autenticar, listarSkills);

export default skillRouter;
import { Router } from 'express';
import bookingController from '../controllers/booking.controller.js';

const bookingRouter = Router();

bookingRouter.get('/', bookingController.get);
bookingRouter.get('/:id', bookingController.getById);
bookingRouter.post('/', bookingController.create);
bookingRouter.put('/:id', bookingController.update);
bookingRouter.delete('/:id', bookingController.remove);

export default bookingRouter;
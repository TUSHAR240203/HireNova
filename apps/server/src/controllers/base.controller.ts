import { Response } from 'express';
import { logger } from '../utils/logger';

export class BaseController {
  protected ok(res: Response, data: any, message: string = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data
    });
  }

  protected created(res: Response, data: any, message: string = 'Created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  protected badRequest(res: Response, error: string = 'Bad Request', code: string = 'BAD_REQUEST') {
    return res.status(400).json({
      success: false,
      error,
      code
    });
  }

  protected unauthorized(res: Response, error: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    return res.status(401).json({
      success: false,
      error,
      code
    });
  }

  protected forbidden(res: Response, error: string = 'Forbidden', code: string = 'FORBIDDEN') {
    return res.status(403).json({
      success: false,
      error,
      code
    });
  }

  protected notFound(res: Response, error: string = 'Resource Not Found', code: string = 'NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error,
      code
    });
  }

  protected serverError(res: Response, error: Error) {
    logger.error('Unhandled Controller Error context: %O', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}

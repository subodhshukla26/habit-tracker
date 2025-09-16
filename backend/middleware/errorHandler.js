// Centralized error handling middleware

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Default to 500 server error
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = error.message;

  // Mongoose bad ObjectId
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        statusCode = 409;
        if (error.constraint?.includes('username')) {
          message = 'Username already exists';
        } else if (error.constraint?.includes('email')) {
          message = 'Email already exists';
        } else if (error.constraint?.includes('user_id_name')) {
          message = 'You already have a habit with this name';
        } else if (error.constraint?.includes('habit_id_completion_date')) {
          message = 'Habit already completed for this date';
        } else if (error.constraint?.includes('follower_id_following_id')) {
          message = 'You are already following this user';
        } else {
          message = 'Duplicate entry';
        }
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Referenced resource does not exist';
        break;
      case '23514': // Check constraint violation
        if (error.constraint?.includes('follower_id_following_id_check')) {
          message = 'You cannot follow yourself';
        } else {
          message = 'Invalid data provided';
        }
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Required field is missing';
        break;
      default:
        message = 'Database error occurred';
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error 
    })
  });
};


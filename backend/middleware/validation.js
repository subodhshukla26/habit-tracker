// Validation middleware for request data

export const validateRegistration = (req, res, next) => {
  const { username, email, password, firstName, lastName } = req.body;
  const errors = [];

  // Username validation
  if (!username || username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email address is required');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Name validation
  if (!firstName || firstName.trim().length < 1) {
    errors.push('First name is required');
  }
  if (!lastName || lastName.trim().length < 1) {
    errors.push('Last name is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Sanitize input
  req.body.username = username.trim().toLowerCase();
  req.body.email = email.trim().toLowerCase();
  req.body.firstName = firstName.trim();
  req.body.lastName = lastName.trim();

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email address is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

export const validateHabit = (req, res, next) => {
  const { name, frequency, targetCount } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 1) {
    errors.push('Habit name is required');
  }
  if (name && name.trim().length > 255) {
    errors.push('Habit name must be less than 255 characters');
  }

  // Frequency validation
  if (!frequency || !['daily', 'weekly'].includes(frequency)) {
    errors.push('Frequency must be either "daily" or "weekly"');
  }

  // Target count validation
  if (targetCount !== undefined) {
    const count = parseInt(targetCount);
    if (isNaN(count) || count < 1 || count > 10) {
      errors.push('Target count must be a number between 1 and 10');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Sanitize input
  req.body.name = name.trim();
  next();
};


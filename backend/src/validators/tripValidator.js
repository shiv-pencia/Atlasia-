export const tripValidator = {
  create: (data) => {
    const { title, destination, startDate, endDate, budget } = data;
    const errors = [];

    if (!title || title.trim().length === 0) {
      errors.push({ message: 'Trip title is required' });
    }

    if (!destination || destination.trim().length === 0) {
      errors.push({ message: 'Destination is required' });
    }

    if (!startDate || isNaN(Date.parse(startDate))) {
      errors.push({ message: 'A valid start date is required' });
    }

    if (!endDate || isNaN(Date.parse(endDate))) {
      errors.push({ message: 'A valid end date is required' });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push({ message: 'Start date cannot be after the end date' });
    }

    if (budget === undefined || isNaN(Number(budget)) || Number(budget) < 0) {
      errors.push({ message: 'Budget must be a positive number' });
    }

    if (errors.length > 0) {
      return { error: { details: errors }, value: data };
    }

    return { error: null, value: data };
  },
  update: (data) => {
    const { title, destination, startDate, endDate, budget } = data;
    const errors = [];

    if (title !== undefined && (!title || title.trim().length === 0)) {
      errors.push({ message: 'Trip title cannot be empty' });
    }

    if (destination !== undefined && (!destination || destination.trim().length === 0)) {
      errors.push({ message: 'Destination cannot be empty' });
    }

    if (startDate !== undefined && isNaN(Date.parse(startDate))) {
      errors.push({ message: 'A valid start date is required' });
    }

    if (endDate !== undefined && isNaN(Date.parse(endDate))) {
      errors.push({ message: 'A valid end date is required' });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push({ message: 'Start date cannot be after the end date' });
    }

    if (budget !== undefined && (isNaN(Number(budget)) || Number(budget) < 0)) {
      errors.push({ message: 'Budget must be a positive number' });
    }

    if (errors.length > 0) {
      return { error: { details: errors }, value: data };
    }

    return { error: null, value: data };
  }
};
export default tripValidator;

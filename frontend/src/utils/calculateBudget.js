/**
 * Calculates the total cost of all expenses in a trip.
 * @param {Array} expenses - List of expense objects containing 'amount' field.
 * @returns {number} - Total expense sum.
 */
export const calculateTotalExpenses = (expenses = []) => {
  return expenses.reduce((total, expense) => total + (Number(expense.amount) || 0), 0);
};

/**
 * Calculates budget summaries including total spent, remaining, and percentage.
 * @param {number} totalBudget - The overall budget limit.
 * @param {Array} expenses - List of expenses.
 * @returns {Object} - Budget summary metrics.
 */
export const calculateBudgetSummary = (totalBudget = 0, expenses = []) => {
  const totalSpent = calculateTotalExpenses(expenses);
  const remaining = Math.max(0, totalBudget - totalSpent);
  const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  return {
    totalBudget,
    totalSpent,
    remaining,
    percentSpent: Math.min(100, percentSpent)
  };
};

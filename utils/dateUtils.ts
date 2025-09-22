export const getCurrentWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days to subtract to get to Monday
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Get Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  
  // Get Friday of current week
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };
  
  return {
    monday: formatDate(monday),
    friday: formatDate(friday),
    weekString: `Week of ${formatDate(monday)} - ${formatDate(friday)}`
  };
};

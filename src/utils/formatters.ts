export const formatCurrency = (value: number, decimals: number = 2): string => {
  return `$${value.toFixed(decimals)}`;
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const getColorForPnL = (value: number): string => {
  if (value > 0) return '#00C853';
  if (value < 0) return '#FF3B30';
  return '#8E8E93';
};

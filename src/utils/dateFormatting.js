export const getLocalDateString = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseToDateString = (dateVal) => {
  if (!dateVal) return null;
  try {
    if (typeof dateVal === 'string' && dateVal.includes('-')) {
      return dateVal.split('T')[0].split(' ')[0];
    }
    const date = new Date(dateVal);
    if (!Number.isNaN(date.getTime())) {
      return getLocalDateString(date);
    }
  } catch {
    return null;
  }
  return null;
};

export const formatDrawTime = (timeStr, drawDate) => {
  if (!timeStr && !drawDate) return 'N/A';
  let rawTime = String(timeStr || '').trim();

  if (/^\d{1,2}$/.test(rawTime)) {
    const hourNum = parseInt(rawTime, 10);
    if (hourNum === 0) rawTime = '12AM';
    else if (hourNum === 12) rawTime = '12PM';
    else if (hourNum > 12) rawTime = `${hourNum - 12}PM`;
    else rawTime = `${hourNum}AM`;
  } else if (rawTime.includes('T') || rawTime.includes(' ')) {
    const parts = rawTime.split(/[\sT]/);
    if (parts.length > 1) {
      const timePart = parts[1].split(':');
      if (timePart.length > 0) {
        const hourNum = parseInt(timePart[0], 10);
        if (!Number.isNaN(hourNum)) {
          if (hourNum === 0) rawTime = '12AM';
          else if (hourNum === 12) rawTime = '12PM';
          else if (hourNum > 12) rawTime = `${hourNum - 12}PM`;
          else rawTime = `${hourNum}AM`;
        }
      }
    }
  }

  const formattedDate = parseToDateString(drawDate || timeStr);
  return formattedDate ? `${rawTime} ${formattedDate}`.trim() : rawTime || 'N/A';
};

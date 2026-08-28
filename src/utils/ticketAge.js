import {parseToDateString} from './dateFormatting';

export const getTicketDate = (ticket) => parseToDateString(
  ticket.drawDate || ticket.drawTime || ticket.created_at || ticket.date
);

export const getTicketAgeInDays = (ticket, currentDate = new Date()) => {
  const ticketDate = getTicketDate(ticket);
  if (!ticketDate) return null;

  const [year, month, day] = ticketDate.split('-').map(Number);
  const issuedDate = new Date(year, month - 1, day);
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  return Math.floor((today - issuedDate) / 86400000);
};

export const isIncidentReportEligible = (ticket) => {
  const ageInDays = getTicketAgeInDays(ticket);
  return ageInDays !== null && ageInDays >= 3;
};

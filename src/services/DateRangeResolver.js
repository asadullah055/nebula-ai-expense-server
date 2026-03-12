import dayjs from 'dayjs';

export class DateRangeResolver {
  resolve({ period = '30d', startDate, endDate }) {
    const now = dayjs();

    if (period === 'custom') {
      if (!startDate || !endDate) {
        throw new Error('Custom period requires startDate and endDate');
      }
      return {
        start: dayjs(startDate).startOf('day').toDate(),
        end: dayjs(endDate).endOf('day').toDate(),
      };
    }

    if (period === '7d') {
      return {
        start: now.subtract(6, 'day').startOf('day').toDate(),
        end: now.endOf('day').toDate(),
      };
    }

    if (period === 'last_month') {
      const lastMonth = now.subtract(1, 'month');
      return {
        start: lastMonth.startOf('month').toDate(),
        end: lastMonth.endOf('month').toDate(),
      };
    }

    return {
      start: now.subtract(29, 'day').startOf('day').toDate(),
      end: now.endOf('day').toDate(),
    };
  }
}

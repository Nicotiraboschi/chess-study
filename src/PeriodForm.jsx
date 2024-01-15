/* eslint-disable react/prop-types */
const PeriodForm = ({
  startPeriod,
  setStartPeriod,
  endPeriod,
  setEndPeriod,
  period,
}) => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const handlePeriodChange = (property, value) => {
    const newStartPeriod = { ...startPeriod, [property]: parseInt(value, 10) };
    const newEndPeriod = { ...endPeriod, [property]: parseInt(value, 10) };

    const unixTimestamp = Math.floor(
      new Date(
        newEndPeriod.endYear,
        newEndPeriod.endMonth - 1,
        newEndPeriod.endDay
      ) / 1000
    );

    const now = Math.floor(new Date() / 1000);

    console.log('unixTimestamp', unixTimestamp, 'now', now);

    period === 'starts'
      ? setStartPeriod(newStartPeriod)
      : unixTimestamp > now
      ? setEndPeriod({
          endYear: new Date().getFullYear(),
          endMonth: new Date().getMonth() + 1,
          endDay: new Date().getDate(),
        })
      : setEndPeriod(newEndPeriod);
    period === 'starts'
      ? console.log('newStartPeriod', newStartPeriod)
      : console.log('newEndPeriod', newEndPeriod);
  };

  return (
    <div style={{ display: 'flex', placeContent: 'center' }}>
      <p
        style={{
          fontWeight: 'bold',
          margin: '0 1rem 0 0',
        }}>{`Period ${period} at:`}</p>

      <label htmlFor="year">year</label>
      <select
        id="year"
        name="year"
        onChange={(e) =>
          handlePeriodChange(
            period === 'starts' ? 'startYear' : 'endYear',
            e.target.value
          )
        }>
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i} value={new Date().getFullYear() - i}>
            {new Date().getFullYear() - i}
          </option>
        ))}
      </select>

      <label htmlFor="month">month</label>
      <select
        id="month"
        name="month"
        onChange={(e) =>
          handlePeriodChange(
            period === 'starts' ? 'startMonth' : 'endMonth',
            e.target.value
          )
        }>
        {monthNames.map((month, index) => (
          <option key={index} value={index + 1}>
            {month}
          </option>
        ))}
      </select>

      <label htmlFor="day">day</label>
      <select
        id="day"
        name="day"
        onChange={(e) =>
          handlePeriodChange(
            period === 'starts' ? 'startDay' : 'endDay',
            e.target.value
          )
        }>
        {Array.from({ length: 31 }, (_, i) => (
          <option key={i} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>
    </div>
  );
};
export default PeriodForm;

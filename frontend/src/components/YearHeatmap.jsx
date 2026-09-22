import { buildYearMonths, monthName, scoreLevel } from "../utils/date";

export default function YearHeatmap({ days, year, onSelectDate }) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const months = buildYearMonths(year);

  return (
    <div className="year-heatmap-wrap">
      <div className="year-heatmap">
        {months.map(({ month, cells }) => (
          <section className="month-block" key={month}>
            <h3>{monthName(month)}</h3>
            <div className="month-grid">
              {cells.map((isoDate, index) => {
                const day = isoDate ? byDate.get(isoDate) : null;
                const level = scoreLevel(day?.score);
                return isoDate ? (
                  <button
                    key={isoDate}
                    className={`heat-cell level-${level}`}
                    title={day ? `${isoDate}: ${day.score}/10` : `${isoDate}: no entry`}
                    onClick={() => onSelectDate?.(isoDate, day)}
                  />
                ) : (
                  <span key={`blank-${month}-${index}`} className="heat-cell blank" />
                );
              })}
            </div>
          </section>
        ))}
        <div className="legend" aria-label="Score legend">
          <span>1</span>
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} className={`legend-box level-${index + 1}`} />
          ))}
          <span>10</span>
        </div>
      </div>
    </div>
  );
}

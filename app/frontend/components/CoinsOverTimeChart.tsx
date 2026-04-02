import React, { useMemo } from 'react';
import type { Session } from '../interfaces/session';

interface CoinsOverTimeChartProps {
  sessions: Session[];
  month: number;
  year: number;
}

const CoinsOverTimeChart: React.FC<CoinsOverTimeChartProps> = ({ sessions, month, year }) => {
  const bars = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyCoins: Record<number, number> = {};

    sessions.forEach((s) => {
      const d = new Date(s.date + 'T00:00:00');
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        const day = d.getDate();
        dailyCoins[day] = (dailyCoins[day] || 0) + s.coin_total;
      }
    });

    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      coins: dailyCoins[i + 1] || 0,
    }));
  }, [sessions, month, year]);

  const maxCoins = Math.max(...bars.map((b) => b.coins), 1);
  const totalCoins = bars.reduce((sum, b) => sum + b.coins, 0);
  const activeDays = bars.filter((b) => b.coins > 0).length;

  return (
    <div>
      <div className="flex items-end gap-px h-24 px-1">
        {bars.map(({ day, coins }) => {
          const heightPct = (coins / maxCoins) * 100;
          return (
            <div key={day} className="group relative flex-1 flex flex-col items-center justify-end h-full">
              <div
                className="w-full rounded-t transition-all duration-500 bg-teal-500 group-hover:bg-teal-400"
                style={{ height: coins > 0 ? `${Math.max(heightPct, 4)}%` : '2px' }}
              />
              {coins > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex flex-col items-center pointer-events-none">
                  <div className="bg-slate-800 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap">
                    Day {day}: {coins.toLocaleString()}
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-0.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 px-1">
        {[1, 5, 10, 15, 20, 25, bars.length].map((d) => (
          <span key={d} className="text-[9px] text-slate-400">{d}</span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900">{totalCoins.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">Total Coins</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900">{activeDays}</p>
          <p className="text-[10px] text-slate-400">Active Days</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900">
            {activeDays > 0 ? Math.round(totalCoins / activeDays).toLocaleString() : 0}
          </p>
          <p className="text-[10px] text-slate-400">Avg / Day</p>
        </div>
      </div>
    </div>
  );
};

export default CoinsOverTimeChart;

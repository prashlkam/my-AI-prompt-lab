import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartDataPoint } from '../types';

interface StatsChartProps {
  data: ChartDataPoint[];
}

const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  return (
    <div className="h-40 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis hide />
          <Tooltip 
            cursor={{fill: '#1e293b'}}
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
             {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;

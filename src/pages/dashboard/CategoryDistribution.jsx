import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Legend, Tooltip 
} from 'recharts';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CategoryDistribution = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px] flex flex-col">
        <div className="h-6 w-32 bg-slate-100 dark:bg-slate-700 rounded mb-8 animate-pulse"></div>
        <div className="flex-1 rounded-full w-48 h-48 mx-auto bg-slate-50 dark:bg-slate-900/50 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Popular Services</h3>
        <p className="text-xs text-slate-500 font-medium">Booking share by category</p>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="count"
              nameKey="categoryName"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoryDistribution;

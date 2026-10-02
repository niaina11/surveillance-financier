import React from 'react';

export default function StatCard({ title, value, sub, color, icon: Icon }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };
  return (
    <div className={`bg-white rounded-xl p-5 border shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        {Icon && (
          <span className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
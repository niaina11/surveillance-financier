import React from 'react';

const levels = {
  CRITIQUE: 'bg-red-100 text-red-700 border-red-300',
  ÉLEVÉ: 'bg-orange-100 text-orange-700 border-orange-300',
  MOYEN: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  FAIBLE: 'bg-green-100 text-green-700 border-green-300',
};

export default function AlertCard({ type, description, level, date }) {
  return (
    <div className={`border rounded-xl p-4 ${levels[level]} mb-3`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">{type}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-bold border ${levels[level]}`}>{level}</span>
      </div>
      <p className="text-sm opacity-80">{description}</p>
      {date && <p className="text-xs opacity-60 mt-1">{date}</p>}
    </div>
  );
}
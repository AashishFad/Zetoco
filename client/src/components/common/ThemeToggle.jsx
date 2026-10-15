/**
 * ThemeToggle
 * Allows switching between Jira Dark Mode and Jira Light Mode.
 */
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-1.5 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors border border-surface-700/60 ${className}`}
      title={isDark ? 'Switch to Jira Light Mode' : 'Switch to Jira Dark Mode'}
      aria-label="Toggle Light / Dark Mode"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
      ) : (
        <Moon className="w-4 h-4 text-brand-600 hover:text-brand-500 transition-colors" />
      )}
    </button>
  );
}

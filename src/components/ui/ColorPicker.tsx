import { useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../stores/themeStore';
import { CloseIcon } from './Icons';

const PRESETS: { name: string; colors: [string, string, string] }[] = [
  { name: 'Indigo', colors: ['#2563eb', '#7c3aed', '#06b6d4'] },
  { name: 'Sunset', colors: ['#f59e0b', '#ef4444', '#ec4899'] },
  { name: 'Forest', colors: ['#10b981', '#3b82f6', '#8b5cf6'] },
  { name: 'Rose', colors: ['#e11d48', '#f43f5e', '#fb7185'] },
];

interface ColorPickerProps {
  onClose: () => void;
}

export function ColorPicker({ onClose }: ColorPickerProps) {
  const { gradientColors, setGradientColors, resetColors } = useThemeStore();
  const [colors, setColors] = useState<[string, string, string]>([...gradientColors]);

  const updateColor = (index: 0 | 1 | 2, value: string) => {
    const next: [string, string, string] = [...colors] as [string, string, string];
    next[index] = value;
    setColors(next);
  };

  const apply = () => {
    setGradientColors(colors);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Theme Colors</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div
          className="h-20 rounded-xl mb-4"
          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})` }}
        />

        <div className="space-y-3 mb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="color"
                value={colors[i]}
                onChange={(e) => updateColor(i as 0 | 1 | 2, e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={colors[i]}
                onChange={(e) => updateColor(i as 0 | 1 | 2, e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono"
              />
              <span className="text-xs text-gray-400 w-8">G-{i + 1}</span>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Presets</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setColors(preset.colors)}
                className="h-10 rounded-lg border border-gray-200 cursor-pointer hover:ring-2 hover:ring-brand-400 transition-all"
                style={{ background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]}, ${preset.colors[2]})` }}
                title={preset.name}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {PRESETS.map((preset) => (
              <span key={preset.name} className="text-[10px] text-gray-400 text-center w-full">{preset.name}</span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { resetColors(); setColors(['#2563eb', '#7c3aed', '#06b6d4']); }}
            className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={apply}
            className="flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[2]})` }}
          >
            Apply
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

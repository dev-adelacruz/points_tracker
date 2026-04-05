import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { systemSettingService } from '../../services/systemSettingService';
import { useToast } from '../../context/ToastContext';
import { Settings } from 'lucide-react';

const SystemSettingsPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const { showToast } = useToast();

  const [atRiskThreshold, setAtRiskThreshold] = useState('20');
  const [inputValue, setInputValue] = useState('20');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const setting = await systemSettingService.getSetting(token, 'at_risk_threshold_pct');
      setAtRiskThreshold(setting.value);
      setInputValue(setting.value);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const numeric = parseFloat(inputValue);
    if (isNaN(numeric) || numeric < 0 || numeric > 100) {
      setError('Threshold must be a number between 0 and 100.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await systemSettingService.updateSetting(token, 'at_risk_threshold_pct', inputValue);
      setAtRiskThreshold(updated.value);
      setInputValue(updated.value);
      showToast('Settings saved.', 'success');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800">System Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure platform-wide thresholds and behaviours.</p>
      </div>

      {loading && <p className="text-sm text-slate-400 p-6">Loading...</p>}

      {!loading && (
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              At-Risk Threshold (%)
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Hosts more than this percentage behind their monthly pace are flagged as at risk.
              Default: 20%.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-24 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving || inputValue === atRiskThreshold}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SystemSettingsPage;

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  MapPin,
  Shield,
  Save,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SystemSettings } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getCurrentBrowserLocation } from '../../utils/geo';
import { Card, Button, Input, Select } from '../../components/common/UIComponents';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const s = await dataService.getSettings();
      setSettings(s);
    };
    loadSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      await dataService.updateSettings(settings);
      await dataService.logAction({
        userId: user?.uid || 'admin',
        userName: user?.name || 'Admin',
        role: 'admin',
        action: 'Updated Institutional System Settings',
        metadata: {
          threshold: settings.attendanceThreshold,
          allowedRadius: settings.attendanceLocation.allowedRadius,
          faceVerification: settings.faceVerificationEnabled,
        },
      });
      showToast('success', 'Settings Updated', 'Attendance configuration saved successfully.');
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message || 'Could not update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDetectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await getCurrentBrowserLocation();
      if (settings) {
        setSettings({
          ...settings,
          attendanceLocation: {
            ...settings.attendanceLocation,
            latitude: Number(loc.latitude.toFixed(6)),
            longitude: Number(loc.longitude.toFixed(6)),
          },
        });
        showToast(
          'success',
          'Coordinates Synced',
          `Set to your location: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
        );
      }
    } catch (err: any) {
      showToast('error', 'Location Failed', err.message || 'Could not access browser location.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            System & Attendance Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure institutional attendance thresholds, campus geofencing, QR duration, and biometrics
          </p>
        </div>
        <Button variant="primary" icon={Save} onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Attendance Threshold Card */}
        <Card title="Attendance Threshold & Academics" subtitle="Minimum mandatory attendance requirement">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Attendance Threshold Percentage (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={50}
                  max={95}
                  value={settings.attendanceThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, attendanceThreshold: Number(e.target.value) })
                  }
                  className="w-32 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 font-bold font-mono"
                />
                <span className="text-xs text-slate-500">
                  (Default: 75%. Students below this will receive warnings.)
                </span>
              </div>
            </div>

            <Input
              label="Academic Term / Semester"
              value={settings.semesterName}
              onChange={(e) => setSettings({ ...settings, semesterName: e.target.value })}
            />
          </div>
        </Card>

        {/* Geolocation Verification Card */}
        <Card
          title="Campus Geolocation & Geofence Boundary"
          subtitle="Verification coordinates and permitted attendance radius for student QR check-ins"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-indigo-900">
                <Compass className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>
                  Students scanning attendance will be verified against this campus boundary.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Compass}
                onClick={handleDetectCurrentLocation}
                disabled={isDetectingLocation}
                className="bg-white"
              >
                {isDetectingLocation ? 'Detecting...' : 'Sync My Current Location'}
              </Button>
            </div>

            <Input
              label="Campus Location / Facility Name"
              value={settings.attendanceLocation.name}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  attendanceLocation: { ...settings.attendanceLocation, name: e.target.value },
                })
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Latitude"
                type="number"
                step="0.000001"
                value={settings.attendanceLocation.latitude}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attendanceLocation: {
                      ...settings.attendanceLocation,
                      latitude: parseFloat(e.target.value),
                    },
                  })
                }
              />

              <Input
                label="Longitude"
                type="number"
                step="0.000001"
                value={settings.attendanceLocation.longitude}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attendanceLocation: {
                      ...settings.attendanceLocation,
                      longitude: parseFloat(e.target.value),
                    },
                  })
                }
              />

              <Input
                label="Allowed Radius (Meters)"
                type="number"
                min={20}
                max={2000}
                value={settings.attendanceLocation.allowedRadius}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attendanceLocation: {
                      ...settings.attendanceLocation,
                      allowedRadius: parseInt(e.target.value, 10),
                    },
                  })
                }
                helperText="Default: 100 meters"
              />
            </div>
          </div>
        </Card>

        {/* QR Code & Biometric Security Card */}
        <Card
          title="QR Security & Face Biometrics"
          subtitle="Configure default session token expiration and facial verification"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default QR Session Duration
              </label>
              <select
                value={settings.defaultQrDuration}
                onChange={(e) =>
                  setSettings({ ...settings, defaultQrDuration: Number(e.target.value) })
                }
                className="w-full py-2.5 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value={30}>30 Seconds (Ultra-Strict)</option>
                <option value={60}>60 Seconds (Recommended Standard)</option>
                <option value={120}>120 Seconds (2 Minutes)</option>
                <option value={300}>300 Seconds (5 Minutes Lecture Hall)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Biometric Face Verification
              </label>
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {settings.faceVerificationEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Matches student camera vector during QR scan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      faceVerificationEnabled: !settings.faceVerificationEnabled,
                    })
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.faceVerificationEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

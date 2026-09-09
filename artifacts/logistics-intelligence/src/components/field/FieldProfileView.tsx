import { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Truck,
  Package,
  Route as RouteIcon,
  Phone,
  Mail,
  Lock,
  Wifi,
  Bluetooth,
  RefreshCw,
  Edit3,
  Save,
  X,
  LogOut,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Bell,
  Radio,
  KeyRound,
} from 'lucide-react';
import type { FleetVehicle, Delivery, RouteSegment } from '@/types';
import {
  type FieldUserProfile,
  type NotificationPreferences,
  getStoredUserProfile,
  saveStoredUserProfile,
  getNotificationPreferences,
  saveNotificationPreferences,
} from '@/services/authService';

interface FieldProfileViewProps {
  vehicle: FleetVehicle;
  delivery: Delivery;
  route: RouteSegment;
  onBack: () => void;
  onViewDelivery: () => void;
  onViewRoute: () => void;
  onLogout: () => void;
}

export function FieldProfileView({
  vehicle,
  delivery,
  route,
  onBack,
  onViewDelivery,
  onViewRoute,
  onLogout,
}: FieldProfileViewProps) {
  const [profile, setProfile] = useState<FieldUserProfile>(getStoredUserProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Editable Form Fields (Only appropriate personal info)
  const [formName, setFormName] = useState(profile.name);
  const [formPhone, setFormPhone] = useState(profile.phone);
  const [formEmail, setFormEmail] = useState(profile.email);
  const [formCallsign, setFormCallsign] = useState(profile.callsign);
  const [formEmergencyContact, setFormEmergencyContact] = useState(profile.emergencyContact);

  // Notification Preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    getNotificationPreferences,
  );

  // Change Password Modal / State (Adapter Boundary)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const updated = saveStoredUserProfile({
      name: formName,
      phone: formPhone,
      email: formEmail,
      callsign: formCallsign,
      emergencyContact: formEmergencyContact,
    });
    setProfile(updated);
    setIsEditing(false);
    setSaveSuccessMsg('Personal profile updated successfully.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  }

  function handleCancelEdit() {
    setFormName(profile.name);
    setFormPhone(profile.phone);
    setFormEmail(profile.email);
    setFormCallsign(profile.callsign);
    setFormEmergencyContact(profile.emergencyContact);
    setIsEditing(false);
  }

  function handleTogglePref(key: keyof NotificationPreferences) {
    const updated = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key],
    };
    setNotificationPrefs(updated);
    saveNotificationPreferences(updated);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback('Passwords do not match. Please re-enter.');
      return;
    }

    setPasswordFeedback('Password updated in local adapter session. (Supabase Auth ready)');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordFeedback(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1800);
  }

  return (
    <div id="field-profile-screen" className="flex flex-col gap-4 sm:gap-5 pb-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          id="btn-profile-back"
          onClick={onBack}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-xs hover:bg-neutral-50 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Operations</span>
        </button>

        <span className="text-xs font-mono font-semibold text-neutral-500">
          ID: {profile.officerId}
        </span>
      </div>

      {saveSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-900 shadow-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. PROFILE HEADER                                            */}
      {/* ============================================================ */}
      <div
        id="profile-header-card"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Avatar with Current Duty Status */}
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-neutral-900 bg-neutral-900 text-2xl font-black text-white shadow-sm sm:h-22 sm:w-22">
              <span>VR</span>
            </div>
            <span
              className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full border-2 border-white bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs"
              title="Current Duty Status: On Duty"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {profile.status}
            </span>
          </div>

          {/* Identity Info */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-lg font-bold text-neutral-950 sm:text-xl">
                {profile.name}
              </h1>
              <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-800">
                {profile.officerId}
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-neutral-600">
              {profile.designation}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-700">
                <Shield className="h-3 w-3 text-neutral-500" />
                <span>{profile.unit}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono text-neutral-700">
                <Radio className="h-3 w-3 text-neutral-500" />
                <span>Callsign: {profile.callsign}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PERSONAL INFORMATION & EDIT PROFILE                       */}
      {/* ============================================================ */}
      <div
        id="profile-personal-info-card"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Personal Information
            </h2>
          </div>

          {!isEditing ? (
            <button
              type="button"
              id="btn-start-edit-profile"
              onClick={() => setIsEditing(true)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 active:scale-[0.98]"
            >
              <Edit3 className="h-3.5 w-3.5 text-neutral-600" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex min-h-[44px] items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {isEditing ? (
          /* Editable Form for User-Level Profile Fields Only */
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900 leading-relaxed">
              <strong>Permission Scope:</strong> You can edit personal contact and identity details. Operational and system-controlled fields (Officer ID, Unit, Assigned Vehicle, Delivery, Route) are managed by Central Dispatch and cannot be modified here.
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Tactical Callsign
                </label>
                <input
                  type="text"
                  value={formCallsign}
                  onChange={(e) => setFormCallsign(e.target.value)}
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-mono text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  required
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Official Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Emergency Contact / HQ Frequency
                </label>
                <input
                  type="text"
                  value={formEmergencyContact}
                  onChange={(e) => setFormEmergencyContact(e.target.value)}
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>
            </div>

            {/* Read-Only System Fields Notice */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-2 border-t border-neutral-100">
              <div className="rounded-xl border border-neutral-200 bg-neutral-100/70 p-3 opacity-80">
                <span className="text-[10px] font-semibold uppercase text-neutral-400 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  Officer ID (System Controlled)
                </span>
                <p className="mt-0.5 font-mono font-bold text-neutral-700">{profile.officerId}</p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-100/70 p-3 opacity-80">
                <span className="text-[10px] font-semibold uppercase text-neutral-400 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  Unit Assignment (System Controlled)
                </span>
                <p className="mt-0.5 font-bold text-neutral-700">{profile.unit}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                id="btn-save-profile"
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-black active:scale-[0.98]"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Profile Changes</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Read-Only Personal Information Display */
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">
                Full Name
              </span>
              <p className="mt-0.5 font-bold text-neutral-900">{profile.name}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">
                Officer ID
              </span>
              <p className="mt-0.5 font-mono font-bold text-neutral-900">{profile.officerId}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">
                Designation
              </span>
              <p className="mt-0.5 font-semibold text-neutral-800">{profile.designation}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400">
                Unit
              </span>
              <p className="mt-0.5 font-semibold text-neutral-800">{profile.unit}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 flex items-center gap-1">
                <Phone className="h-2.5 w-2.5 text-neutral-500" />
                Phone / Contact
              </span>
              <p className="mt-0.5 font-mono font-medium text-neutral-900">{profile.phone}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 flex items-center gap-1">
                <Mail className="h-2.5 w-2.5 text-neutral-500" />
                Email Address
              </span>
              <p className="mt-0.5 font-medium text-neutral-900 truncate">{profile.email}</p>
            </div>

            <div className="sm:col-span-2 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 flex items-center gap-1">
                <Radio className="h-2.5 w-2.5 text-neutral-500" />
                Tactical Callsign & Emergency HQ Frequency
              </span>
              <p className="mt-0.5 font-medium text-neutral-800">
                {profile.callsign} • {profile.emergencyContact}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. READ-ONLY WORK ASSIGNMENT: CURRENT ASSIGNMENT             */}
      {/* ============================================================ */}
      <div
        id="profile-current-assignment-card"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Current Assignment
            </h2>
          </div>
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1 border border-neutral-200">
            <Lock className="h-2.5 w-2.5" />
            <span>Read Only • Admin Controlled</span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
          {/* Assigned Vehicle */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-neutral-400">
                Assigned Vehicle
              </span>
              <Truck className="h-3.5 w-3.5 text-neutral-500" />
            </div>
            <p className="mt-1 font-mono font-bold text-neutral-900 text-sm">
              {vehicle.id}
            </p>
            <p className="text-[11px] text-neutral-600">
              {vehicle.type} • {vehicle.status}
            </p>
          </div>

          {/* Assigned Delivery */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-neutral-400">
                Assigned Delivery
              </span>
              <Package className="h-3.5 w-3.5 text-neutral-500" />
            </div>
            <p className="mt-1 font-mono font-bold text-neutral-900 text-sm">
              {delivery.id}
            </p>
            <p className="text-[11px] text-neutral-600">
              {delivery.commodity} • Status: {delivery.status}
            </p>
          </div>

          {/* Assigned Route */}
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-red-800">
                Assigned Route
              </span>
              <RouteIcon className="h-3.5 w-3.5 text-red-600" />
            </div>
            <p className="mt-1 font-mono font-bold text-red-950 text-sm">
              {route.id}
            </p>
            <p className="text-[11px] text-red-800 font-semibold">
              {route.label} • {route.status.toUpperCase()} (Risk {route.riskScore})
            </p>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-neutral-500">
          Assignment parameters (vehicle, route corridor, risk level, and cargo manifest) are controlled by Central Dispatch and cannot be modified by the field operator.
        </p>

        {/* Navigation Quick Links to Full Screens */}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            id="btn-profile-view-delivery"
            onClick={onViewDelivery}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100 active:scale-[0.98]"
          >
            <Package className="h-4 w-4 text-neutral-600" />
            <span>View My Delivery</span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
          </button>

          <button
            type="button"
            id="btn-profile-view-route"
            onClick={onViewRoute}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-black active:scale-[0.98]"
          >
            <RouteIcon className="h-4 w-4 text-emerald-400" />
            <span>View My Route</span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-300" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. ACCOUNT SETTINGS & ACTIONS                                */}
      {/* ============================================================ */}
      <div
        id="profile-account-settings-card"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Lock className="h-4 w-4 text-neutral-700" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Account Settings
          </h2>
        </div>

        <div className="mt-4 space-y-3.5 text-xs">
          {/* Change Password Trigger */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
            <div>
              <p className="font-bold text-neutral-900">Change Password</p>
              <p className="text-[11px] text-neutral-500">
                Update security PIN / access password (adapter boundary)
              </p>
            </div>
            <button
              type="button"
              id="btn-open-change-password"
              onClick={() => setShowPasswordModal(!showPasswordModal)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 font-semibold text-neutral-800 hover:bg-neutral-100 shadow-2xs"
            >
              <KeyRound className="h-3.5 w-3.5 text-neutral-600" />
              <span>Change Password</span>
            </button>
          </div>

          {/* Change Password Inline Form / Modal */}
          {showPasswordModal && (
            <form
              onSubmit={handlePasswordSubmit}
              className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                  Update Security Password
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">
                  Supabase Auth Adapter Ready
                </span>
              </div>

              {passwordFeedback && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-[11px] text-blue-900">
                  {passwordFeedback}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="mt-1 block min-h-[44px] w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  id="btn-submit-new-password"
                  className="flex-1 min-h-[44px] rounded-xl border border-neutral-900 bg-neutral-900 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-black"
                >
                  Confirm Password Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Notification Preferences Toggles */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Bell className="h-3.5 w-3.5 text-neutral-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                Notification Preferences
              </span>
            </div>

            <div className="space-y-2">
              <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 cursor-pointer hover:bg-neutral-100/60">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900">Critical Corridor Alerts</p>
                  <p className="text-[11px] text-neutral-500">
                    Immediate notification for road blockages and disruptions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.criticalAlerts}
                  onChange={() => handleTogglePref('criticalAlerts')}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                />
              </label>

              <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 cursor-pointer hover:bg-neutral-100/60">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900">Route Risk Updates</p>
                  <p className="text-[11px] text-neutral-500">
                    Updates when Corridor Delta weather or hazard index changes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.routeRiskUpdates}
                  onChange={() => handleTogglePref('routeRiskUpdates')}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                />
              </label>

              <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 cursor-pointer hover:bg-neutral-100/60">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900">Dispatch Directives</p>
                  <p className="text-[11px] text-neutral-500">
                    Official advisories regarding ALT-104 bypass routes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.dispatchAdvisories}
                  onChange={() => handleTogglePref('dispatchAdvisories')}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                />
              </label>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-3 border-t border-neutral-100">
            <button
              type="button"
              id="btn-profile-logout"
              onClick={onLogout}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs font-bold text-red-800 transition-colors hover:bg-red-100 active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4 text-red-600" />
              <span>Log Out of Duty Station</span>
            </button>
            <p className="mt-1.5 text-center text-[10px] text-neutral-400">
              Logging out ends this session and returns to the Sign In screen.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. CONNECTIVITY / READINESS STATUS                           */}
      {/* ============================================================ */}
      <div
        id="profile-connectivity-card"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Connectivity & System Readiness
            </h2>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            Field Offline-Ready
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
          {/* Network Status */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
              Network
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold">
              {isOnline ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-900">Online</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-amber-900">Offline</span>
                </>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              {isOnline ? 'Cellular data detected' : 'Local cache active'}
            </p>
          </div>

          {/* Last Sync */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
              Last Sync
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold text-neutral-900">
              <RefreshCw className="h-3.5 w-3.5 text-neutral-600" />
              <span>{profile.lastSyncTime}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              Local incident cache up to date
            </p>
          </div>

          {/* Bluetooth Readiness */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
              Bluetooth
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold text-neutral-900">
              <Bluetooth className="h-3.5 w-3.5 text-neutral-600" />
              <span>Ready (Standby)</span>
            </div>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              Adapter ready for telemetry integration • Prototype
            </p>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-neutral-500 leading-relaxed">
          <strong>Note:</strong> Status indicators reflect device state. When operating without cellular reception in mountain corridors, all incident submissions and route data are persisted locally.
        </p>
      </div>
    </div>
  );
}

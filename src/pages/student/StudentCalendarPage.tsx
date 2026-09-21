import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Badge, Modal, Button } from '../../components/common/UIComponents';

export const StudentCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 0-indexed: 8 = September
  const [selectedDateRecords, setSelectedDateRecords] = useState<{ date: string; records: AttendanceRecord[] } | null>(null);

  useEffect(() => {
    const load = async () => {
      const stId = user?.studentId || 'student-1';
      const atts = await dataService.getAttendanceByStudent(stId);
      setAttendance(atts);
    };
    load();
  }, [user]);

  // Calendar calculations
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Group attendance records by date
  const recordsByDate: Record<string, AttendanceRecord[]> = {};
  attendance.forEach((rec) => {
    if (!recordsByDate[rec.date]) recordsByDate[rec.date] = [];
    recordsByDate[rec.date].push(rec);
  });

  const handleDateClick = (dayNumber: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(dayNumber).padStart(2, '0');
    const dateStr = `${currentYear}-${mm}-${dd}`;
    const recs = recordsByDate[dateStr] || [];
    setSelectedDateRecords({ date: dateStr, records: recs });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Calendar</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monthly schedule of lecture attendances with daily visual indicators (P / A / L)
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono px-2">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Monthly Calendar View */}
      <Card className="p-4 sm:p-6 shadow-md border-slate-200">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Day cells grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty prefix slots */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16 sm:h-24 bg-slate-50/50 rounded-xl border border-transparent" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const mm = String(currentMonth + 1).padStart(2, '0');
            const dd = String(dayNum).padStart(2, '0');
            const dateStr = `${currentYear}-${mm}-${dd}`;
            const dayRecords = recordsByDate[dateStr] || [];

            const isWeekend = (firstDayIndex + i) % 7 === 0 || (firstDayIndex + i) % 7 === 6;

            const hasPresent = dayRecords.some((r) => r.status === 'Present');
            const hasAbsent = dayRecords.some((r) => r.status === 'Absent');
            const hasLate = dayRecords.some((r) => r.status === 'Late');

            return (
              <div
                key={dayNum}
                onClick={() => !isWeekend && handleDateClick(dayNum)}
                className={`h-16 sm:h-24 p-2 rounded-2xl border transition-all flex flex-col justify-between text-left cursor-pointer ${
                  isWeekend
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    : dayRecords.length > 0
                    ? 'bg-white hover:border-indigo-400 hover:shadow-md border-slate-200'
                    : 'bg-white hover:border-slate-300 border-slate-100'
                }`}
              >
                <span className={`text-xs font-bold ${isWeekend ? 'text-slate-300' : 'text-slate-700'}`}>
                  {dayNum}
                </span>

                {/* Status indicators */}
                {!isWeekend && dayRecords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    {hasPresent && (
                      <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                        P
                      </span>
                    )}
                    {hasAbsent && (
                      <span className="w-5 h-5 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-black flex items-center justify-center">
                        A
                      </span>
                    )}
                    {hasLate && (
                      <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center">
                        L
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      {dayRecords.length} classes
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold text-slate-600">Indicator Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
              P
            </span>
            <span className="text-slate-600">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center justify-center">
              A
            </span>
            <span className="text-slate-600">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">
              L
            </span>
            <span className="text-slate-600">Late Arrival</span>
          </div>
        </div>
      </Card>

      {/* Date Drilldown Detail Modal (Section 24 requirement: Clicking a date should show attendance details) */}
      {selectedDateRecords && (
        <Modal
          isOpen={Boolean(selectedDateRecords)}
          onClose={() => setSelectedDateRecords(null)}
          title={`Attendance Details: ${selectedDateRecords.date}`}
          subtitle="Lecture-by-lecture participation record for this day"
        >
          <div className="space-y-3">
            {selectedDateRecords.records.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                No lectures or attendance sessions recorded on this day.
              </p>
            ) : (
              selectedDateRecords.records.map((rec) => (
                <div
                  key={rec.attendanceId}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{rec.subjectName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {rec.period} • Method: {rec.verificationMethod}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      rec.status === 'Present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.status === 'Absent'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>
              ))
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedDateRecords(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

/**
 * Attendance Calculations & Risk Analytics
 */

export interface AttendanceSummary {
  totalConducted: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
  statusRisk: 'Low Risk' | 'Medium Risk' | 'High Risk';
  classesNeededFor75: number;
  classesCanMissAbove75: number;
  isBelowThreshold: boolean;
}

export function calculateAttendanceStats(
  present: number,
  absent: number,
  late: number = 0,
  threshold: number = 75
): AttendanceSummary {
  // Total classes is present + absent + late
  const total = present + absent + late;
  if (total === 0) {
    return {
      totalConducted: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      percentage: 100,
      statusRisk: 'Low Risk',
      classesNeededFor75: 0,
      classesCanMissAbove75: 0,
      isBelowThreshold: false,
    };
  }

  // Attendance % formula: Present / Total * 100
  // Note: Late is counted as present for partial participation or counted with present
  const effectivePresent = present + late;
  const percentage = Number(((effectivePresent / total) * 100).toFixed(1));
  const targetRate = threshold / 100;

  let classesNeededFor75 = 0;
  let classesCanMissAbove75 = 0;
  let statusRisk: 'Low Risk' | 'Medium Risk' | 'High Risk' = 'Low Risk';

  if (percentage < threshold) {
    // Student is currently below threshold
    statusRisk = 'High Risk';
    // Formula: (targetRate * total - effectivePresent) / (1 - targetRate)
    const needed = Math.ceil((targetRate * total - effectivePresent) / (1 - targetRate));
    classesNeededFor75 = Math.max(1, needed);
    classesCanMissAbove75 = 0;
  } else {
    // Student is above threshold
    if (percentage < threshold + 5) {
      statusRisk = 'Medium Risk'; // 75% to 79.9%
    } else {
      statusRisk = 'Low Risk'; // >= 80%
    }
    // Formula: (effectivePresent - targetRate * total) / targetRate
    const canMiss = Math.floor((effectivePresent - targetRate * total) / targetRate);
    classesCanMissAbove75 = Math.max(0, canMiss);
    classesNeededFor75 = 0;
  }

  return {
    totalConducted: total,
    presentCount: present,
    absentCount: absent,
    lateCount: late,
    percentage,
    statusRisk,
    classesNeededFor75,
    classesCanMissAbove75,
    isBelowThreshold: percentage < threshold,
  };
}

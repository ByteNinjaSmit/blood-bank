import { QUESTIONS } from "@/features/donor/donor-constants";

export const getDaysDifference = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return null;
  const p1 = dateStr1.split('-');
  const p2 = dateStr2.split('-');
  if (p1.length !== 3 || p2.length !== 3) return null;
  const y1 = parseInt(p1[0], 10);
  const m1 = parseInt(p1[1], 10) - 1;
  const d1 = parseInt(p1[2], 10);
  const y2 = parseInt(p2[0], 10);
  const m2 = parseInt(p2[1], 10) - 1;
  const d2 = parseInt(p2[2], 10);
  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) return null;
  const date1 = new Date(y1, m1, d1);
  const date2 = new Date(y2, m2, d2);
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateAgeFromDob = (dobStr) => {
  if (!dobStr) return "";
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? String(age) : "";
};

export const validateDate = (value) => {
  if (!value) return false;
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(value)) return false;

  const parts = value.match(regex);
  const d = parseInt(parts[1], 10);
  const m = parseInt(parts[2], 10);
  const y = parseInt(parts[3], 10);

  if (m < 1 || m > 12) return false;
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d < 1 || d > daysInMonth) return false;

  const inputDate = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (inputDate > today) return false;

  return true;
};

// Validates a MM/YYYY month input (used for Last Donation Date): a real month
// in a sane year range that isn't in the future.
export const validateMonthYear = (value) => {
  if (!value) return false;
  const parts = value.match(/^(\d{2})\/(\d{4})$/);
  if (!parts) return false;
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (m < 1 || m > 12) return false;
  if (y < 1900 || y > 2100) return false;
  const now = new Date();
  if (y * 12 + (m - 1) > now.getFullYear() * 12 + now.getMonth()) return false;
  return true;
};

export const calculateUntilDate = (days) => {
  if (days === 0) return null; // permanent
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const getFitnessExamReason = (data) => {
  if (data.skinDiseaseFreeAtPhlebotomy === "No") {
    return {
      reason: "Unfit due to Fitness Exam: Skin disease present at the phlebotomy site",
      days: 30,
      type: "TEMPORARY",
    };
  }
  if (data.armsFreeFromPunctureScars === "No") {
    return {
      reason: "Unfit due to Fitness Exam: Arms/forearms are not free from skin puncture marks",
      days: 30,
      type: "TEMPORARY",
    };
  }
  return null;
};

export const getUnhealthyQuestionReason = (data) => {
  const yesRequired = ["q2", "q3", "q6", "q7", "q30", "q31", "q32", "q33", "q34", "q35", "q36"];
  for (let i = 1; i <= 36; i++) {
    const key = `q${i}`;
    const val = data[key];
    const qText = QUESTIONS.find((q) => q.key === key)?.text || `Question ${i}`;

    let isUnhealthy = false;
    if (yesRequired.includes(key)) {
      if (val === "No") isUnhealthy = true;
    } else {
      if (val === "Yes") isUnhealthy = true;
    }

    if (isUnhealthy) {
      const isPermanent = key === "q23" || key === "q25";
      return {
        reason: `Unfit due to Medical Question: ${qText}`,
        days: isPermanent ? 0 : 30,
        type: isPermanent ? "PERMANENT" : "TEMPORARY"
      };
    }
  }
  return null;
};

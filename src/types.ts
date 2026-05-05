export interface LifeData {
  weeksLived: number;
  weeksTotal: number;
  // Non-negative weeks remaining for display (0 if already surpassed)
  weeksRemaining: number;
  // Signed weeks remaining: positive = weeks left, negative = weeks past the expectancy
  weeksRemainingSigned: number;
  // Non-negative weeks surpassed (0 if not surpassed)
  weeksSurpassed: number;
  // Percentage of the average expectancy lived (may be >100 to indicate surpassed average)
  percentageLived: number;
  yearsLived: number;
  daysLived: number;
}

export interface ActivityStats {
  sleep: number;
  work: number;
  eating: number;
  bathroom: number;
  grooming: number;
  commute: number;
  chores: number;
  leisure: number;
}

export interface CountryLifeExpectancy {
  name: string;
  code: string;
  expectancy: number; // in years
}

export enum ActivityType {
  SLEEP = "Sleep",
  WORK = "Work",
  EATING = "Eating",
  BATHROOM = "Bathroom",
  GROOMING = "Hygiene",
  COMMUTE = "Commute",
  CHORES = "Chores",
  LEISURE = "Quality Time",
}

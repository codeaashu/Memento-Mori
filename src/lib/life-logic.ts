import { ActivityStats, CountryLifeExpectancy, LifeData } from "../types";

// A simplified dataset of life expectancy (Years)
export const COUNTRY_DATA: CountryLifeExpectancy[] = [
  { name: "Afghanistan", code: "AFG", expectancy: 66.0 },
  { name: "Albania", code: "ALB", expectancy: 79.6 },
  { name: "Algeria", code: "DZA", expectancy: 76.3 },
  { name: "Andorra", code: "AND", expectancy: 84.0 },
  { name: "Angola", code: "AGO", expectancy: 64.6 },
  { name: "Antigua and Barbuda", code: "ATG", expectancy: 77.6 },
  { name: "Argentina", code: "ARG", expectancy: 77.4 },
  { name: "Armenia", code: "ARM", expectancy: 75.7 },
  { name: "Aruba", code: "ABW", expectancy: 76.3 },
  { name: "Australia", code: "AUS", expectancy: 83.9 },
  { name: "Austria", code: "AUT", expectancy: 82.0 },
  { name: "Azerbaijan", code: "AZE", expectancy: 74.4 },
  { name: "Bahamas", code: "BHS", expectancy: 74.5 },
  { name: "Bahrain", code: "BHR", expectancy: 81.3 },
  { name: "Bangladesh", code: "BGD", expectancy: 74.7 },
  { name: "Barbados", code: "BRB", expectancy: 76.2 },
  { name: "Belarus", code: "BLR", expectancy: 74.4 },
  { name: "Belgium", code: "BEL", expectancy: 82.1 },
  { name: "Belize", code: "BLZ", expectancy: 73.6 },
  { name: "Benin", code: "BEN", expectancy: 60.8 },
  { name: "Bermuda", code: "BMU", expectancy: 82.3 },
  { name: "Bhutan", code: "BTN", expectancy: 73.0 },
  { name: "Bolivia", code: "BOL", expectancy: 68.6 },
  { name: "Bosnia and Herzegovina", code: "BIH", expectancy: 77.8 },
  { name: "Botswana", code: "BWA", expectancy: 69.2 },
  { name: "Brazil", code: "BRA", expectancy: 75.8 },
  { name: "Brunei", code: "BRN", expectancy: 75.3 },
  { name: "Bulgaria", code: "BGR", expectancy: 75.6 },
  { name: "Burkina Faso", code: "BFA", expectancy: 61.1 },
  { name: "Burundi", code: "BDI", expectancy: 63.6 },
  { name: "Cambodia", code: "KHM", expectancy: 70.7 },
  { name: "Cameroon", code: "CMR", expectancy: 63.7 },
  { name: "Canada", code: "CAN", expectancy: 82.6 },
  { name: "Cape Verde", code: "CPV", expectancy: 76.1 },
  { name: "Cayman Islands", code: "CYM", expectancy: 80.4 },
  { name: "Central African Republic", code: "CAF", expectancy: 57.4 },
  { name: "Chad", code: "TCD", expectancy: 55.1 },
  { name: "Chile", code: "CHL", expectancy: 81.2 },
  { name: "China", code: "CHN", expectancy: 78.0 },
  { name: "Colombia", code: "COL", expectancy: 77.7 },
  { name: "Comoros", code: "COM", expectancy: 66.8 },
  { name: "Congo", code: "COG", expectancy: 65.8 },
  { name: "Costa Rica", code: "CRI", expectancy: 80.8 },
  { name: "Croatia", code: "HRV", expectancy: 78.6 },
  { name: "Cuba", code: "CUB", expectancy: 78.1 },
  { name: "Curaçao", code: "CUW", expectancy: 76.8 },
  { name: "Cyprus", code: "CYP", expectancy: 81.7 },
  { name: "Czech Republic", code: "CZE", expectancy: 79.8 },
  { name: "DR Congo", code: "COD", expectancy: 61.9 },
  { name: "Denmark", code: "DNK", expectancy: 81.9 },
  { name: "Djibouti", code: "DJI", expectancy: 66.0 },
  { name: "Dominica", code: "DMA", expectancy: 71.1 },
  { name: "Dominican Republic", code: "DOM", expectancy: 73.7 },
  { name: "Ecuador", code: "ECU", expectancy: 77.4 },
  { name: "Egypt", code: "EGY", expectancy: 71.6 },
  { name: "El Salvador", code: "SLV", expectancy: 72.1 },
  { name: "Equatorial Guinea", code: "GNQ", expectancy: 63.7 },
  { name: "Eritrea", code: "ERI", expectancy: 68.6 },
  { name: "Estonia", code: "EST", expectancy: 79.2 },
  { name: "Eswatini", code: "SWZ", expectancy: 64.1 },
  { name: "Ethiopia", code: "ETH", expectancy: 67.3 },
  { name: "Faroe Islands", code: "FRO", expectancy: 80.2 },
  { name: "Fiji", code: "FJI", expectancy: 67.3 },
  { name: "Finland", code: "FIN", expectancy: 81.9 },
  { name: "France", code: "FRA", expectancy: 83.3 },
  { name: "French Guiana", code: "GUF", expectancy: 77.0 },
  { name: "French Polynesia", code: "PYF", expectancy: 84.1 },
  { name: "Gabon", code: "GAB", expectancy: 68.3 },
  { name: "Gambia", code: "GMB", expectancy: 65.9 },
  { name: "Georgia", code: "GEO", expectancy: 74.5 },
  { name: "Germany", code: "DEU", expectancy: 81.4 },
  { name: "Ghana", code: "GHA", expectancy: 65.5 },
  { name: "Global Average", code: "GLO", expectancy: 73.3 },
  { name: "Greece", code: "GRC", expectancy: 81.9 },
  { name: "Greenland", code: "GRL", expectancy: 70.1 },
  { name: "Grenada", code: "GRD", expectancy: 75.2 },
  { name: "Guadeloupe", code: "GLP", expectancy: 82.0 },
  { name: "Guam", code: "GUM", expectancy: 77.2 },
  { name: "Guatemala", code: "GTM", expectancy: 72.6 },
  { name: "Guernsey", code: "GGY", expectancy: 83.3 },
  { name: "Guinea", code: "GIN", expectancy: 60.7 },
  { name: "Guinea-Bissau", code: "GNB", expectancy: 64.1 },
  { name: "Guyana", code: "GUY", expectancy: 70.2 },
  { name: "Haiti", code: "HTI", expectancy: 64.9 },
  { name: "Honduras", code: "HND", expectancy: 72.9 },
  { name: "Hong Kong", code: "HKG", expectancy: 85.5 },
  { name: "Hungary", code: "HUN", expectancy: 77.0 },
  { name: "Iceland", code: "ISL", expectancy: 82.7 },
  { name: "India", code: "IND", expectancy: 72.0 },
  { name: "Indonesia", code: "IDN", expectancy: 71.2 },
  { name: "Iran", code: "IRN", expectancy: 77.7 },
  { name: "Iraq", code: "IRQ", expectancy: 72.3 },
  { name: "Ireland", code: "IRL", expectancy: 82.4 },
  { name: "Isle of Man", code: "IMN", expectancy: 81.0 },
  { name: "Israel", code: "ISR", expectancy: 82.4 },
  { name: "Italy", code: "ITA", expectancy: 83.7 },
  { name: "Ivory Coast", code: "CIV", expectancy: 61.9 },
  { name: "Jamaica", code: "JAM", expectancy: 71.5 },
  { name: "Japan", code: "JPN", expectancy: 84.7 },
  { name: "Jersey", code: "JEY", expectancy: 79.7 },
  { name: "Jordan", code: "JOR", expectancy: 77.8 },
  { name: "Kazakhstan", code: "KAZ", expectancy: 74.4 },
  { name: "Kenya", code: "KEN", expectancy: 63.6 },
  { name: "Kiribati", code: "KIR", expectancy: 66.5 },
  { name: "Kuwait", code: "KWT", expectancy: 80.4 },
  { name: "Kyrgyzstan", code: "KGZ", expectancy: 71.7 },
  { name: "Laos", code: "LAO", expectancy: 69.0 },
  { name: "Latvia", code: "LVA", expectancy: 76.2 },
  { name: "Lebanon", code: "LBN", expectancy: 77.8 },
  { name: "Lesotho", code: "LSO", expectancy: 57.4 },
  { name: "Liberia", code: "LBR", expectancy: 62.2 },
  { name: "Libya", code: "LBY", expectancy: 69.3 },
  { name: "Lithuania", code: "LTU", expectancy: 76.0 },
  { name: "Luxembourg", code: "LUX", expectancy: 82.2 },
  { name: "Macau", code: "MAC", expectancy: 83.1 },
  { name: "Madagascar", code: "MDG", expectancy: 63.6 },
  { name: "Malawi", code: "MWI", expectancy: 67.3 },
  { name: "Malaysia", code: "MYS", expectancy: 76.7 },
  { name: "Maldives", code: "MDV", expectancy: 81.0 },
  { name: "Mali", code: "MLI", expectancy: 60.4 },
  { name: "Malta", code: "MLT", expectancy: 83.3 },
  { name: "Martinique", code: "MTQ", expectancy: 82.6 },
  { name: "Mauritania", code: "MRT", expectancy: 68.5 },
  { name: "Mauritius", code: "MUS", expectancy: 74.9 },
  { name: "Mayotte", code: "MYT", expectancy: 76.0 },
  { name: "Mexico", code: "MEX", expectancy: 75.1 },
  { name: "Micronesia", code: "FSM", expectancy: 67.2 },
  { name: "Moldova", code: "MDA", expectancy: 71.2 },
  { name: "Mongolia", code: "MNG", expectancy: 71.7 },
  { name: "Montenegro", code: "MNE", expectancy: 77.1 },
  { name: "Morocco", code: "MAR", expectancy: 75.3 },
  { name: "Mozambique", code: "MOZ", expectancy: 63.6 },
  { name: "Myanmar", code: "MMR", expectancy: 66.9 },
  { name: "Namibia", code: "NAM", expectancy: 67.4 },
  { name: "Nepal", code: "NPL", expectancy: 70.3 },
  { name: "New Caledonia", code: "NCL", expectancy: 78.8 },
  { name: "New Zealand", code: "NZL", expectancy: 82.1 },
  { name: "Nicaragua", code: "NIC", expectancy: 75.0 },
  { name: "Niger", code: "NER", expectancy: 61.2 },
  { name: "Nigeria", code: "NGA", expectancy: 54.5 },
  { name: "North Korea", code: "PRK", expectancy: 73.6 },
  { name: "North Macedonia", code: "MKD", expectancy: 77.4 },
  { name: "Norway", code: "NOR", expectancy: 83.3 },
  { name: "Oman", code: "OMN", expectancy: 80.0 },
  { name: "Pakistan", code: "PAK", expectancy: 67.7 },
  { name: "Palestine", code: "PSE", expectancy: 65.2 },
  { name: "Panama", code: "PAN", expectancy: 79.6 },
  { name: "Papua New Guinea", code: "PNG", expectancy: 66.1 },
  { name: "Paraguay", code: "PRY", expectancy: 73.8 },
  { name: "Peru", code: "PER", expectancy: 77.7 },
  { name: "Philippines", code: "PHL", expectancy: 69.8 },
  { name: "Poland", code: "POL", expectancy: 78.6 },
  { name: "Portugal", code: "PRT", expectancy: 82.4 },
  { name: "Puerto Rico", code: "PRI", expectancy: 81.7 },
  { name: "Qatar", code: "QAT", expectancy: 82.4 },
  { name: "Romania", code: "ROU", expectancy: 75.9 },
  { name: "Russia", code: "RUS", expectancy: 73.2 },
  { name: "Rwanda", code: "RWA", expectancy: 67.8 },
  { name: "Réunion", code: "REU", expectancy: 83.5 },
  { name: "Saint Lucia", code: "LCA", expectancy: 72.7 },
  { name: "Saint Vincent and the Grenadines", code: "VCT", expectancy: 71.2 },
  { name: "Samoa", code: "WSM", expectancy: 71.7 },
  { name: "Saudi Arabia", code: "SAU", expectancy: 78.7 },
  { name: "Senegal", code: "SEN", expectancy: 68.7 },
  { name: "Serbia", code: "SRB", expectancy: 76.8 },
  { name: "Seychelles", code: "SYC", expectancy: 72.9 },
  { name: "Sierra Leone", code: "SLE", expectancy: 61.8 },
  { name: "Singapore", code: "SGP", expectancy: 83.7 },
  { name: "Slovakia", code: "SVK", expectancy: 78.3 },
  { name: "Slovenia", code: "SVN", expectancy: 81.6 },
  { name: "Solomon Islands", code: "SLB", expectancy: 70.5 },
  { name: "Somalia", code: "SOM", expectancy: 58.8 },
  { name: "South Africa", code: "ZAF", expectancy: 66.1 },
  { name: "South Korea", code: "KOR", expectancy: 84.3 },
  { name: "South Sudan", code: "SSD", expectancy: 57.6 },
  { name: "Spain", code: "ESP", expectancy: 83.7 },
  { name: "Sri Lanka", code: "LKA", expectancy: 77.5 },
  { name: "Sudan", code: "SDN", expectancy: 66.3 },
  { name: "Suriname", code: "SUR", expectancy: 73.6 },
  { name: "Sweden", code: "SWE", expectancy: 83.3 },
  { name: "Switzerland", code: "CHE", expectancy: 84.0 },
  { name: "Syria", code: "SYR", expectancy: 72.1 },
  { name: "São Tomé and Príncipe", code: "STP", expectancy: 69.7 },
  { name: "Taiwan", code: "TWN", expectancy: 80.6 },
  { name: "Tajikistan", code: "TJK", expectancy: 71.8 },
  { name: "Tanzania", code: "TZA", expectancy: 67.0 },
  { name: "Thailand", code: "THA", expectancy: 76.4 },
  { name: "Timor-Leste", code: "TLS", expectancy: 67.7 },
  { name: "Togo", code: "TGO", expectancy: 62.7 },
  { name: "Tonga", code: "TON", expectancy: 72.9 },
  { name: "Trinidad and Tobago", code: "TTO", expectancy: 73.5 },
  { name: "Tunisia", code: "TUN", expectancy: 76.5 },
  { name: "Turkmenistan", code: "TKM", expectancy: 70.1 },
  { name: "Uganda", code: "UGA", expectancy: 68.2 },
  { name: "Ukraine", code: "UKR", expectancy: 73.4 },
  { name: "United Arab Emirates", code: "ARE", expectancy: 82.9 },
  { name: "United Kingdom", code: "GBR", expectancy: 81.3 },
  { name: "United States", code: "USA", expectancy: 79.3 },
  { name: "Uruguay", code: "URY", expectancy: 78.1 },
  { name: "Uzbekistan", code: "UZB", expectancy: 72.4 },
  { name: "Vanuatu", code: "VUT", expectancy: 71.5 },
  { name: "Vietnam", code: "VNM", expectancy: 74.6 },
  { name: "Western Sahara", code: "ESH", expectancy: 71.4 },
  { name: "Yemen", code: "YEM", expectancy: 69.3 },
  { name: "Zambia", code: "ZMB", expectancy: 66.3 },
  { name: "Zimbabwe", code: "ZWE", expectancy: 62.8 },
];

// Weekly hours distribution (Estimates)
export const WEEKLY_HOURS = {
  TOTAL: 168,
  SLEEP: 56, // 8h * 7
  WORK: 40, // Standard work week
  EATING: 10, // ~1.5h * 7
  BATHROOM: 2, // ~15-20min * 7
  GROOMING: 5, // Showers, prep
  COMMUTE: 8, // ~1h+ * 5
  CHORES: 10, // Cleaning, cooking, errands
  // LEISURE is the remainder
};

export const calculateLifeData = (
  birthDate: Date,
  expectancyYears: number,
): LifeData => {
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const msPerWeek = msPerDay * 7;

  const diffTime = Math.abs(now.getTime() - birthDate.getTime());
  const weeksLived = Math.floor(diffTime / msPerWeek);
  const daysLived = Math.floor(diffTime / msPerDay);
  const yearsLived = Number((daysLived / 365.25).toFixed(2));

  const totalWeeks = Math.floor(expectancyYears * 52.1775);

  // Signed remaining: positive means weeks remaining, negative means already surpassed
  const weeksRemainingSigned = totalWeeks - weeksLived;
  const weeksRemaining = Math.max(0, weeksRemainingSigned);
  const weeksSurpassed = Math.max(0, -weeksRemainingSigned);

  // Allow percentage to exceed 100 so UI can indicate surpassed expectancy
  const percentageLived = (weeksLived / totalWeeks) * 100;

  return {
    weeksLived,
    weeksTotal: totalWeeks,
    weeksRemaining,
    weeksRemainingSigned,
    weeksSurpassed,
    percentageLived,
    yearsLived,
    daysLived,
  };
};

export const calculateActivityStats = (lifeData: LifeData): ActivityStats => {
  // We project these hours over the TOTAL lifespan to show the weight of existence
  const totalWeeks = lifeData.weeksTotal;

  const calculateTotalHours = (weeklyHours: number) => weeklyHours * totalWeeks;

  // Note: Work is usually only for ~45 years (approx 2340 weeks), not whole life
  // Adjusting work calculation to be more realistic (ages 20-65)
  const workWeeks = 45 * 52;

  return {
    sleep: calculateTotalHours(WEEKLY_HOURS.SLEEP),
    work: WEEKLY_HOURS.WORK * workWeeks, // Only during working years
    eating: calculateTotalHours(WEEKLY_HOURS.EATING),
    bathroom: calculateTotalHours(WEEKLY_HOURS.BATHROOM),
    grooming: calculateTotalHours(WEEKLY_HOURS.GROOMING),
    commute: calculateTotalHours(WEEKLY_HOURS.COMMUTE), // Assuming commute scales with work usually, but often continues for other reasons
    chores: calculateTotalHours(WEEKLY_HOURS.CHORES),
    leisure:
      WEEKLY_HOURS.TOTAL * totalWeeks -
      (calculateTotalHours(WEEKLY_HOURS.SLEEP) +
        WEEKLY_HOURS.WORK * workWeeks +
        calculateTotalHours(WEEKLY_HOURS.EATING) +
        calculateTotalHours(WEEKLY_HOURS.BATHROOM) +
        calculateTotalHours(WEEKLY_HOURS.GROOMING) +
        calculateTotalHours(WEEKLY_HOURS.COMMUTE) +
        calculateTotalHours(WEEKLY_HOURS.CHORES)),
  };
};

export const guessCountryFromTimezone = (): CountryLifeExpectancy => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (tz.includes("Tokyo")) return COUNTRY_DATA.find((c) => c.code === "JPN")!;
  if (
    tz.includes("New_York") ||
    tz.includes("Los_Angeles") ||
    tz.includes("Chicago")
  )
    return COUNTRY_DATA.find((c) => c.code === "USA")!;
  if (tz.includes("London")) return COUNTRY_DATA.find((c) => c.code === "GBR")!;
  if (tz.includes("Berlin")) return COUNTRY_DATA.find((c) => c.code === "DEU")!;
  if (tz.includes("Paris")) return COUNTRY_DATA.find((c) => c.code === "FRA")!;
  if (tz.includes("Sydney")) return COUNTRY_DATA.find((c) => c.code === "AUS")!;
  if (tz.includes("Shanghai"))
    return COUNTRY_DATA.find((c) => c.code === "CHN")!;

  // Default fallback
  return COUNTRY_DATA.find((c) => c.code === "USA") || COUNTRY_DATA[0];
};

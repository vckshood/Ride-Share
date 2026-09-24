// Fare calculation engine - mirrors and extends your original Java logic
// Base rates per km for each vehicle type
const BASE_RATES = {
  bike: 10,    // ₹10/km - same as your BikeRide.java
  auto: 15,    // ₹15/km
  car: 20,     // ₹20/km - same as your CarRide.java
  premium: 40, // ₹40/km
};

const BASE_FARE = {
  bike: 25,
  auto: 30,
  car: 50,
  premium: 100,
};

const PER_MINUTE_RATE = {
  bike: 1,
  auto: 1.5,
  car: 2,
  premium: 3,
};

// Surge pricing based on demand
export function calculateSurgeMultiplier(activeRides, availableDrivers) {
  if (availableDrivers === 0) return 2.5;
  const ratio = activeRides / availableDrivers;
  if (ratio > 3) return 2.0;
  if (ratio > 2) return 1.75;
  if (ratio > 1.5) return 1.5;
  if (ratio > 1) return 1.25;
  return 1.0;
}

// Main fare calculation
export function calculateFare(vehicleType, distanceKm, durationMinutes = null, surgeMultiplier = 1.0) {
  const base = BASE_FARE[vehicleType] || BASE_FARE.car;
  const perKm = BASE_RATES[vehicleType] || BASE_RATES.car;
  const perMin = PER_MINUTE_RATE[vehicleType] || PER_MINUTE_RATE.car;

  let fare = base + (perKm * distanceKm);

  if (durationMinutes) {
    fare += perMin * durationMinutes;
  }

  fare *= surgeMultiplier;

  // Minimum fare
  const minimumFares = { bike: 30, auto: 40, car: 60, premium: 150 };
  fare = Math.max(fare, minimumFares[vehicleType] || 60);

  return Math.round(fare * 100) / 100;
}

// Estimate duration based on distance and vehicle type
export function estimateDuration(distanceKm, vehicleType) {
  const avgSpeeds = { bike: 30, auto: 20, car: 25, premium: 25 }; // km/h in city
  const speed = avgSpeeds[vehicleType] || 25;
  return Math.ceil((distanceKm / speed) * 60); // minutes
}

// Get fare estimates for all vehicle types
export function getFareEstimates(distanceKm, surgeMultiplier = 1.0) {
  const types = ['bike', 'auto', 'car', 'premium'];
  return types.map(type => {
    const duration = estimateDuration(distanceKm, type);
    const fare = calculateFare(type, distanceKm, duration, surgeMultiplier);
    return {
      vehicleType: type,
      distanceKm,
      estimatedDuration: duration,
      baseFare: BASE_FARE[type],
      perKmRate: BASE_RATES[type],
      surgeMultiplier,
      totalFare: fare,
    };
  });
}

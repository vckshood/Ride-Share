import java.util.Scanner;

// Custom Exception
class InvalidRideTypeException extends Exception {
    public InvalidRideTypeException(String message) {
        super(message);
    }
}

// Abstract Ride class
abstract class Ride {
    private String driverName;
    private String vehicleNumber;
    protected double distance;

    public Ride(String driverName, String vehicleNumber, double distance) {
        this.driverName = driverName;
        this.vehicleNumber = vehicleNumber;
        this.distance = distance;
    }

    public String getDriverName() {
        return driverName;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public double getDistance() {
        return distance;
    }

    public abstract double calculateFare();
}

// BikeRide class
class BikeRide extends Ride {
    public BikeRide(String driverName, String vehicleNumber, double distance) {
        super(driverName, vehicleNumber, distance);
    }

    @Override
    public double calculateFare() {
        return distance * 10;
    }
}

// CarRide class
class CarRide extends Ride {
    public CarRide(String driverName, String vehicleNumber, double distance) {
        super(driverName, vehicleNumber, distance);
    }

    @Override
    public double calculateFare() {
        return distance * 20;
    }
}

// Main class
public class RideSharingSystem {
    public static void main(String[] args) {
        try (Scanner sc = new Scanner(System.in)) {  
            String rideType = sc.nextLine().trim().toLowerCase();
            double distance = sc.nextDouble();

            if (distance <= 0) {
                throw new IllegalArgumentException("Distance must be greater than 0.");
            }

            Ride ride;
            switch (rideType) {
                case "bike":
                    ride = new BikeRide("Utkarsh anand", "MH12AB1234", distance);
                    break;
                case "car":
                    ride = new CarRide("Jaya shankar", "MH14XY5678", distance);
                    break;
                default:
                    throw new InvalidRideTypeException("Invalid ride type: " + rideType);
            }

            // Output
            System.out.println("Driver: " + ride.getDriverName());
            System.out.println("Vehicle No: " + ride.getVehicleNumber());
            System.out.println("Distance: " + ride.getDistance() + " km");
            System.out.println("Fare: ₹" + ride.calculateFare());

        } catch (InvalidRideTypeException e) {
            System.out.println(e.getMessage());
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}

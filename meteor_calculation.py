import math

# Preset densities (kg/m³) for common types
DENSITY_PRESETS = {
    "Stony": 3000,
    "Iron": 8000,
    "Comet": 500
}

def get_float(prompt, min_value=None, max_value=None, default=None):
    while True:
        try:
            inp = input(prompt)
            if inp == "" and default is not None:
                return default
            value = float(inp)
            if min_value is not None and value < min_value:
                print(f"Value must be at least {min_value}.")
                continue
            if max_value is not None and value > max_value:
                print(f"Value must be at most {max_value}.")
                continue
            return value
        except ValueError:
            print("Please enter a valid number.")

def select_density():
    print("\nSelect meteor type:")
    for i, t in enumerate(DENSITY_PRESETS, 1):
        print(f"{i}. {t} ({DENSITY_PRESETS[t]} kg/m³)")
    print(f"{len(DENSITY_PRESETS)+1}. Custom")
    while True:
        choice = input("Enter choice number: ")
        try:
            idx = int(choice)
            if 1 <= idx <= len(DENSITY_PRESETS):
                return list(DENSITY_PRESETS.values())[idx-1]
            elif idx == len(DENSITY_PRESETS)+1:
                return get_float("Enter custom density (kg/m³): ", min_value=100, max_value=15000)
            else:
                print("Invalid choice.")
        except ValueError:
            print("Please enter a valid number.")

def meteor_properties():
    print("Enter your custom meteor parameters:")

    diameter = get_float("Diameter (m) [1-2000]: ", min_value=1, max_value=2000)
    density = select_density()
    velocity = get_float("Velocity at impact (km/s) [11-72]: ", min_value=11, max_value=72)
    angle = get_float("Impact angle (degrees, default 45) [0-90]: ", min_value=0, max_value=90, default=45)
    location_lat = get_float("Impact latitude (deg, optional -90 to 90) [default 0]: ", min_value=-90, max_value=90, default=0)
    location_lon = get_float("Impact longitude (deg, optional -180 to 180) [default 0]: ", min_value=-180, max_value=180, default=0)

    radius = diameter / 2
    volume = (4/3) * math.pi * (radius ** 3)
    mass = density * volume  # in kg
    velocity_m_s = velocity * 1000  # convert to m/s

    kinetic_energy = 0.5 * mass * (velocity_m_s ** 2)  # in Joules
    tnt_equiv = kinetic_energy / 4.184e9  # in tons of TNT

    print("\n--- Meteor Physical Properties ---")
    print(f"Diameter: {diameter} m")
    print(f"Density: {density} kg/m^3")
    print(f"Mass (calculated): {mass:.2f} kg")
    print(f"Velocity: {velocity} km/s ({velocity_m_s} m/s)")
    print(f"Impact angle: {angle} degrees")
    print(f"Impact location: ({location_lat}, {location_lon})")
    print(f"Kinetic energy: {kinetic_energy:.2e} Joules")
    print(f"TNT equivalent: {tnt_equiv:.2f} tons")

if __name__ == "__main__":
    meteor_properties()
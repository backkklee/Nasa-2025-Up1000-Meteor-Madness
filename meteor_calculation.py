import pandas as pd
import numpy as np
from astropy import units as u
from astropy.time import Time
from poliastro.bodies import Sun, Earth
from poliastro.twobody import Orbit

def select_asteroid(df):
    print("\nSelect an asteroid by its name, id, or designation:")
    print(df[['id', 'name', 'designation']].head(10))  # Show preview
    key = input("Enter asteroid id, name, or designation: ").strip()
    # Flexible match
    sel = df[(df['id'].astype(str) == key) | (df['name'] == key) | (df['designation'].astype(str) == key)]
    if sel.empty:
        print("Asteroid not found.")
        return None
    return sel.iloc[0]

def calc_potential_impact(row):
    a = float(row['a'])  # semi-major axis (AU)
    e = float(row['e'])  # eccentricity
    inc = float(row['i'])  # inclination (deg)
    raan = float(row['om'])  # longitude of ascending node (deg)
    argp = float(row['w'])   # argument of perihelion (deg)
    M = float(row['ma'])     # mean anomaly at epoch (deg)
    epoch_jd = float(row['epoch'])  # Julian Date
    epoch = Time(epoch_jd, format='jd', scale='tdb')
    
    asteroid = Orbit.from_classical(Sun, a*u.au, e*u.one, inc*u.deg, raan*u.deg, argp*u.deg, M*u.deg, epoch=epoch)
    earth = Orbit.from_body_ephem(Earth, epoch=epoch)
    N = 1000
    times = epoch + np.linspace(0, 365, N)*u.day
    ast_pos = asteroid.sample(times)
    earth_pos = earth.sample(times)
    ast_xyz = ast_pos.xyz.to(u.km).value.T
    earth_xyz = earth_pos.xyz.to(u.km).value.T
    dists = np.linalg.norm(ast_xyz - earth_xyz, axis=1)
    min_idx = np.argmin(dists)
    min_dist = dists[min_idx]

    if min_dist < 6371:
        print("Potential impact detected!")
        impact_coords = ast_xyz[min_idx]
        x, y, z = impact_coords
        r = np.linalg.norm(impact_coords)
        lat = np.arcsin(z / r) * 180/np.pi
        lon = np.arctan2(y, x) * 180/np.pi
        print(f"Closest approach: {min_dist:.1f} km (lat={lat:.2f}, lon={lon:.2f})")
    else:
        print(f"No impact. Closest approach: {min_dist:.1f} km")

if __name__ == '__main__':
    df = pd.read_csv('asteroid_data_full.csv')  # Your merged, enriched dataset
    row = select_asteroid(df)
    if row is not None:
        calc_potential_impact(row)
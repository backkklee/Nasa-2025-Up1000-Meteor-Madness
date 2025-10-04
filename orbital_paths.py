import pandas as pd
import numpy as np
from astropy import units as u
from astropy.time import Time
from poliastro.bodies import Sun
from poliastro.twobody import Orbit
import json

def get_orbit_points(row, days=365, steps=200):
    a = float(row['a']) ; e = float(row['e']) ; inc = float(row['i'])
    raan = float(row['om']); argp = float(row['w']); M = float(row['ma'])
    epoch_jd = float(row['epoch'])
    epoch = Time(epoch_jd, format='jd', scale='tdb')
    orb = Orbit.from_classical(Sun, a*u.au, e*u.one, inc*u.deg, raan*u.deg, argp*u.deg, M*u.deg, epoch=epoch)
    times = epoch + np.linspace(0, days, steps) * u.day
    pos = orb.sample(times)
    return pos.xyz.to(u.au).value.T # [steps, 3]

# Example: get points for a row
df = pd.read_csv('asteroid_data_full.csv')
row = df.iloc[0]
points = get_orbit_points(row)
with open('orbit_points.json', 'w') as f:
    json.dump(points.tolist(), f)
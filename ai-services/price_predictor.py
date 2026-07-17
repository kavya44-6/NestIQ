import sys
import json
import math
import os

try:
    import numpy as np
    import pandas as pd
    from sklearn.ensemble import RandomForestRegressor
    HAS_ML = True
except ImportError:
    HAS_ML = False

HAS_SKLEARN = HAS_ML

CITY_BASE_RATES = {
    "chennai": 22.0,
    "coimbatore": 15.0,
    "madurai": 12.0,
    "tiruchirappalli": 11.0,
    "salem": 10.0,
    "tiruppur": 10.5,
    "vellore": 9.5
}

CITY_GROWTH_RATES = {
    "chennai": 8.4,
    "coimbatore": 7.2,
    "madurai": 5.8,
    "tiruchirappalli": 6.1,
    "salem": 5.2,
    "tiruppur": 5.5,
    "vellore": 4.8
}

CSV_PATH = "tamil_nadu_properties.csv"

def generate_synthetic_dataset():
    """Generates 500 realistic Tamil Nadu properties and saves to CSV."""
    if os.path.exists(CSV_PATH):
        try:
            return pd.read_csv(CSV_PATH)
        except Exception:
            pass

    np.random.seed(42)
    n = 500
    cities = np.random.choice(list(CITY_BASE_RATES.keys()), n)
    areas = np.random.randint(400, 3000, n)
    bhks = np.random.randint(1, 5, n)
    furnishings = np.random.choice(["Unfurnished", "Semi Furnished", "Fully Furnished"], n)
    parkings = np.random.choice([0, 1], n)
    ages = np.random.randint(1, 20, n)
    bathrooms = np.random.randint(1, 4, n)

    records = []
    for i in range(n):
        city = cities[i]
        area = int(areas[i])
        bhk = int(bhks[i])
        furn = furnishings[i]
        park = int(parkings[i])
        age = int(ages[i])
        bath = int(bathrooms[i])

        base_rate = CITY_BASE_RATES[city]
        bhk_factor = 0.8 + bhk * 0.1
        rent = base_rate * area * bhk_factor

        furn_mult = 1.25 if furn == "Fully Furnished" else 1.10 if furn == "Semi Furnished" else 1.00
        rent *= furn_mult

        if park:
            rent += 1500
        rent += (bath - 1) * 1200
        rent -= age * 120

        # Add Gaussian noise
        noise = np.random.normal(0, rent * 0.04)
        rent = max(3000, int(rent + noise))

        records.append({
            "city": city.capitalize(),
            "area": area,
            "bhk": bhk,
            "furnishing": furn,
            "parking": park,
            "age": age,
            "bathrooms": bath,
            "rent": rent
        })

    df = pd.DataFrame(records)
    try:
        df.to_csv(CSV_PATH, index=False)
    except Exception:
        pass
    return df

def train_valuation_model(df):
    """Trains a RandomForestRegressor model on the dataset."""
    # Convert categorical furnishing to numeric: Unfurnished=0, Semi=1, Fully=2
    furn_map = {"Unfurnished": 0, "Semi Furnished": 1, "Fully Furnished": 2}
    
    # One-hot encode cities or map to base rates
    df_train = df.copy()
    df_train["furnishing_num"] = df_train["furnishing"].map(furn_map)
    df_train["city_rate"] = df_train["city"].str.lower().map(CITY_BASE_RATES)

    X = df_train[["city_rate", "area", "bhk", "furnishing_num", "parking", "age", "bathrooms"]]
    y = df_train["rent"]

    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)
    return model

# Setup model on load if library is active
df_dataset = None
ml_model = None
if HAS_ML:
    try:
        df_dataset = generate_synthetic_dataset()
        ml_model = train_valuation_model(df_dataset)
    except Exception:
        HAS_ML = False

def calculate_valuation_pure(city, bhk, area, furnished, parking, age, bathrooms):
    """Fallback math valuation system."""
    base_rate = CITY_BASE_RATES.get(city.lower(), 12.0)
    bhk_factor = 0.8 + bhk * 0.1
    rent = base_rate * area * bhk_factor

    furn_mult = 1.25 if furnished == "Fully Furnished" else 1.10 if furnished == "Semi Furnished" else 1.00
    rent *= furn_mult

    if parking:
        rent += 1500
    rent += (bathrooms - 1) * 1200
    rent -= age * 120

    return max(3000.0, round(rent, 0))

def run_valuation(city, bhk, area, furnished, parking, age, bathrooms):
    """Executes the AI model or pure math fallback and returns all dashboard metrics."""
    # Resolve parameters
    bhk = int(bhk)
    area = float(area)
    age = float(age)
    bathrooms = int(bathrooms)
    parking_bool = bool(parking)

    # 1. Price prediction
    if HAS_ML and ml_model is not None:
        furn_map = {"Unfurnished": 0, "Semi Furnished": 1, "Fully Furnished": 2}
        furn_num = furn_map.get(furnished, 1)
        city_rate = CITY_BASE_RATES.get(city.lower(), 12.0)
        X_pred = [[city_rate, area, bhk, furn_num, 1 if parking_bool else 0, age, bathrooms]]
        predicted_rent = ml_model.predict(X_pred)[0]
    else:
        predicted_rent = calculate_valuation_pure(city, bhk, area, furnished, parking_bool, age, bathrooms)

    predicted_rent = round(predicted_rent, 0)
    min_rent = round(predicted_rent * 0.90)
    max_rent = round(predicted_rent * 1.10)

    # 2. Confidence Score (based on distance bounds)
    confidence = 87
    if area < 500 or area > 2500:
        confidence = 74
    if age > 15:
        confidence -= 5

    # 3. Market position & demand
    city_base = CITY_BASE_RATES.get(city.lower(), 12.0)
    expected_avg = city_base * area * (0.8 + bhk * 0.1)
    ratio = predicted_rent / expected_avg
    market_position = "Fairly Priced"
    if ratio < 0.9:
        market_position = "Underpriced"
    elif ratio > 1.1:
        market_position = "Overpriced"

    demand_level = "High" if city.lower() in ["chennai", "coimbatore"] else "Moderate"
    area_growth = CITY_GROWTH_RATES.get(city.lower(), 5.5)

    # 4. Explainable AI Factors
    factors_increasing = []
    factors_reducing = []

    # Area contribution
    area_factor = (area * city_base) / predicted_rent
    factors_increasing.append({
        "factor": "Carpet Area Size",
        "impact": f"+{round(area_factor * 100, 1)}%",
        "reason": f"Substantial area footprint ({int(area)} sqft)"
    })

    # Furnishing impact
    if furnished == "Fully Furnished":
        factors_increasing.append({
            "factor": "Furnishing Premium",
            "impact": "+25.0%",
            "reason": "Fully furnished convenience setup"
        })
    elif furnished == "Semi Furnished":
        factors_increasing.append({
            "factor": "Furnishing Fit",
            "impact": "+10.0%",
            "reason": "Semi furnished fittings built-in"
        })

    # Parking/Amenities
    if parking_bool:
        factors_increasing.append({
            "factor": "Dedicated Parking Slot",
            "impact": "+7.5%",
            "reason": "Secure covered parking available"
        })
    else:
        factors_reducing.append({
            "factor": "No Dedicated Parking",
            "impact": "-8.0%",
            "reason": "Requires street or open area parking space"
        })

    # Bathrooms
    if bathrooms >= 3:
        factors_increasing.append({
            "factor": "Multi Bathroom Config",
            "impact": "+6.0%",
            "reason": f"Convenient layout with {bathrooms} bathrooms"
        })

    # Age depreciation
    if age >= 10:
        dep_pct = min(25.0, round(age * 1.2, 1))
        factors_reducing.append({
            "factor": "Building Age Depreciation",
            "impact": f"-{dep_pct}%",
            "reason": f"Older structure profile ({int(age)} years)"
        })
    else:
        factors_increasing.append({
            "factor": "Modern Construction Profile",
            "impact": "+5.0%",
            "reason": f"Newer property age ({int(age)} years)"
        })

    # 5. Comparable Properties (dynamic matching search on synthetic dataset)
    comparables = []
    if df_dataset is not None:
        # Distance mapping: normalized difference of area, bhk, rent
        df_comp = df_dataset[df_dataset["city"].str.lower() == city.lower()].copy()
        if not df_comp.empty:
            df_comp["dist"] = (
                (df_comp["area"] - area) / area
            ) ** 2 + (
                (df_comp["bhk"] - bhk) / bhk
            ) ** 2
            df_comp = df_comp.sort_values(by="dist").head(3)
            for _, row in df_comp.iterrows():
                comp_rent = int(row["rent"])
                diff = comp_rent - predicted_rent
                diff_str = f"+₹{diff}" if diff >= 0 else f"-₹{abs(diff)}"
                sim_pct = max(55.0, min(99.0, 100.0 - math.sqrt(row["dist"]) * 100))
                comparables.append({
                    "title": f"{row['bhk']} BHK in {row['city']}",
                    "rent": comp_rent,
                    "difference": diff_str,
                    "similarity": round(sim_pct, 1)
                })
    
    # Fallback comparables if dataset empty
    if not comparables:
        comparables = [
            {"title": f"{bhk} BHK Premium Listing", "rent": int(predicted_rent * 1.05), "difference": f"+₹{int(predicted_rent * 0.05)}", "similarity": 92.5},
            {"title": f"{bhk} BHK Standard Listing", "rent": int(predicted_rent * 0.98), "difference": f"-₹{int(predicted_rent * 0.02)}", "similarity": 95.0},
            {"title": f"{bhk} BHK Value Listing", "rent": int(predicted_rent * 0.92), "difference": f"-₹{int(predicted_rent * 0.08)}", "similarity": 88.0}
        ]

    # 6. Future Forecasts
    growth_rate = CITY_GROWTH_RATES.get(city.lower(), 5.5) / 100.0
    forecasts = [
        {"months": 3, "rent": round(predicted_rent * (1 + growth_rate * 0.25)), "change": f"+{round(growth_rate * 25, 1)}%"},
        {"months": 6, "rent": round(predicted_rent * (1 + growth_rate * 0.50)), "change": f"+{round(growth_rate * 50, 1)}%"},
        {"months": 12, "rent": round(predicted_rent * (1 + growth_rate)), "change": f"+{round(growth_rate * 100, 1)}%"}
    ]

    return {
        "predicted_rent": predicted_rent,
        "estimatedMin": min_rent,
        "estimatedMax": max_rent,
        "confidenceScore": confidence,
        "marketPosition": market_position,
        "demandLevel": demand_level,
        "areaGrowth": area_growth,
        "factorsIncreasing": factors_increasing,
        "factorsReducing": factors_reducing,
        "comparableProperties": comparables,
        "futureForecasts": forecasts,
        "engine": "RandomForestRegressor" if (HAS_ML and ml_model is not None) else "Rule-based Math Model"
    }

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        city = input_data.get("city", "Chennai")
        bhk = input_data.get("bhk", 2)
        area = input_data.get("area", 1000)
        furnished = input_data.get("furnished", "Semi Furnished")
        parking = input_data.get("parking", True)
        age = input_data.get("property_age", 5)
        bathrooms = input_data.get("bathrooms", 2)

        res = run_valuation(city, bhk, area, furnished, parking, age, bathrooms)
        print(json.dumps({
            "status": "success",
            **res
        }))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

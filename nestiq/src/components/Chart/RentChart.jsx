import React from "react";
import { rentData } from "../../data/users";

// For simplicity, we'll render a bar chart using plain divs.
// Later you can swap this with Chart.js or Recharts for more advanced visuals.

export default function RentChart() {
  const cities = Object.keys(rentData);

  return (
    <div>
      <h3 style={{ marginBottom: "16px", color: "var(--text-primary)" }}>
        Average Rent by City
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {cities.map((city) => {
          const avgRent = rentData[city].base + rentData[city].perSqft * 10; // sample calc
          return (
            <div key={city} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "100px", fontSize: "14px", color: "var(--text-secondary)" }}>
                {city}
              </span>
              <div
                style={{
                  flex: 1,
                  height: "20px",
                  backgroundColor: "var(--green-50)",
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${avgRent / 100}px`,
                    height: "100%",
                    backgroundColor: "var(--green-600)",
                  }}
                />
              </div>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                ₹{avgRent}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import sys
import json
import math

# Try importing numpy & sklearn; fallback to pure python if missing
try:
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

def pure_python_cosine_similarity(vec1, vec2):
    dot_product = sum(p*q for p,q in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(p**2 for p in vec1))
    magnitude2 = math.sqrt(sum(q**2 for q in vec2))
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

def calculate_similarity_pure(user, properties):
    matches = []
    user_amenities = set(a.lower().strip() for a in user.get("amenities", []))
    
    for p in properties:
        score = 0.0
        # City match (weight = 25)
        if user.get("city", "").lower() == p.get("city", "").lower():
            score += 25.0
            
        # BHK fit (weight = 20)
        user_bhk = int(user.get("bhk", 2))
        p_bhk = int(p.get("bhk", p.get("bedrooms", 2)))
        bhk_diff = abs(user_bhk - p_bhk)
        score += max(0.0, 20.0 - (bhk_diff * 8.0))
        
        # Budget fit (weight = 25)
        user_budget = float(user.get("budget", 10000000))
        p_price = float(p.get("price", 0))
        if p_price <= user_budget:
            score += 25.0
        else:
            excess = p_price - user_budget
            score += max(0.0, 25.0 - (excess / user_budget) * 25.0)
            
        # Property type match (weight = 15)
        if user.get("property_type", "").lower() == p.get("propertyType", p.get("property_type", "")).lower():
            score += 15.0
            
        # Amenities match (weight = 15)
        p_amenities = set(a.lower().strip() for a in p.get("amenities", []))
        if user_amenities:
            intersection = user_amenities.intersection(p_amenities)
            score += (len(intersection) / len(user_amenities)) * 15.0
        else:
            score += 15.0
            
        matches.append({
            "id": p.get("id"),
            "title": p.get("title"),
            "matchScore": round(score, 1),
            "reasoning": f"Matches {round(score, 1)}% of your criteria (Price: \u20b9{int(p_price)} in {p.get('city')})."
        })
        
    matches.sort(key=lambda x: x["matchScore"], reverse=True)
    return matches

def calculate_similarity_sklearn(user, properties):
    # Vectorize text profiles of properties vs user
    user_profile = f"{user.get('city', '')} {user.get('property_type', '')} {' '.join(user.get('amenities', []))}"
    prop_profiles = []
    for p in properties:
        p_prof = f"{p.get('city', '')} {p.get('propertyType', p.get('property_type', ''))} {' '.join(p.get('amenities', []))}"
        prop_profiles.append(p_prof)
        
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([user_profile] + prop_profiles)
    
    # Cosine similarities
    sim_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    
    matches = []
    for idx, p in enumerate(properties):
        # 1. Budget Match (30%)
        user_budget = float(user.get("budget", 100000))
        p_price = float(p.get("price", 0))
        budget_score = 100.0 if p_price <= user_budget else max(0.0, 100.0 - ((p_price - user_budget) / user_budget) * 100.0)

        # 2. Lifestyle Match (25%)
        lifestyle_score = sim_scores[idx] * 100.0

        # 3. Commute Match (15%)
        commute_score = 75.0
        # Check if workplace city matches or keywords overlap
        if user.get("city", "").lower() == p.get("city", "").lower():
            commute_score = 85.0
        else:
            commute_score = 40.0

        # 4. Family Match (15%)
        user_bhk = int(user.get("bhk", 2))
        p_bhk = int(p.get("bhk", p.get("bedrooms", 2)))
        bhk_score = max(0.0, 100.0 - abs(user_bhk - p_bhk) * 35.0)

        # 5. Trust Match (10%)
        trust_score = float(p.get("trustScore", 70.0))

        # 6. Verification Match (5%)
        verification_score = 100.0 if p.get("verified", False) else 50.0

        # Calculate final weighted score
        total_score = (0.30 * budget_score +
                       0.25 * lifestyle_score +
                       0.15 * commute_score +
                       0.15 * bhk_score +
                       0.10 * trust_score +
                       0.05 * verification_score)

        matches.append({
            "id": p.get("id"),
            "title": p.get("title"),
            "matchScore": round(total_score, 1),
            "reasoning": f"ML cosine match rating of {round(total_score, 1)}% based on personalized Tamil Nadu scoring."
        })
        
    matches.sort(key=lambda x: x["matchScore"], reverse=True)
    return matches

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        user = input_data.get("user", {})
        properties = input_data.get("properties", [])
        
        if HAS_SKLEARN:
            results = calculate_similarity_sklearn(user, properties)
        else:
            results = calculate_similarity_pure(user, properties)
            
        print(json.dumps({"status": "success", "engine": "sklearn" if HAS_SKLEARN else "pure_python", "results": results[:5]}))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

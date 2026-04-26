import json
import math
from pathlib import Path

import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "flipkart_com-ecommerce_sample (1).xls"
OUTPUT = ROOT / "app-data.js"


def primary_category(value: str) -> str:
    if pd.isna(value):
        return "Unknown"
    text = str(value).strip()
    text = text.replace('[""', '').replace('""]', '')
    text = text.replace('["', '').replace('"]', '')
    parts = [part.strip().strip('"') for part in text.split('>>') if part.strip()]
    return parts[0] if parts else "Unknown"


def clean_text(value, fallback="Unknown"):
    if pd.isna(value):
        return fallback
    text = str(value).strip()
    return text if text else fallback


print(f"Reading source file: {SOURCE.name}")
df = pd.read_csv(SOURCE)
df["retail_price"] = pd.to_numeric(df["retail_price"], errors="coerce")
df["discounted_price"] = pd.to_numeric(df["discounted_price"], errors="coerce")
df = df.dropna(subset=["retail_price", "discounted_price"]).copy()
df = df[df["retail_price"] > 0].copy()
df["brand"] = df["brand"].apply(clean_text)
df["product_name"] = df["product_name"].apply(clean_text)
df["primary_category"] = df["product_category_tree"].apply(primary_category)
df["discount_percent"] = ((df["retail_price"] - df["discounted_price"]) / df["retail_price"]) * 100

df["discount_percent"] = df["discount_percent"].replace([math.inf, -math.inf], 0).fillna(0)
df = df.sort_values(["discount_percent", "retail_price"], ascending=[False, False]).reset_index(drop=True)

X = df[["retail_price"]]
y = df["discounted_price"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = LinearRegression()
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

brand_counts = df["brand"].value_counts().head(10)
category_counts = df["primary_category"].value_counts().head(10)

products = []
for _, row in df.iterrows():
    products.append(
        {
            "name": clean_text(row["product_name"]),
            "brand": clean_text(row["brand"]),
            "category": clean_text(row["primary_category"]),
            "retail": round(float(row["retail_price"]), 2),
            "discounted": round(float(row["discounted_price"]), 2),
            "discountPercent": round(float(row["discount_percent"]), 2),
            "rating": clean_text(row.get("product_rating", "No rating available"), "No rating available"),
            "url": clean_text(row.get("product_url", ""), ""),
        }
    )

payload = {
    "summary": {
        "totalProducts": int(len(df)),
        "totalBrands": int(df["brand"].nunique()),
        "averageRetailPrice": round(float(df["retail_price"].mean()), 2),
        "averageDiscountedPrice": round(float(df["discounted_price"].mean()), 2),
        "averageDiscountPercent": round(float(df["discount_percent"].mean()), 2),
        "maxRetailPrice": round(float(df["retail_price"].max()), 2),
        "minRetailPrice": round(float(df["retail_price"].min()), 2),
    },
    "model": {
        "slope": round(float(model.coef_[0]), 8),
        "intercept": round(float(model.intercept_), 8),
        "mse": round(float(mean_squared_error(y_test, y_pred)), 2),
        "r2": round(float(r2_score(y_test, y_pred)), 4),
    },
    "topBrands": [{"name": name, "count": int(count)} for name, count in brand_counts.items()],
    "topCategories": [{"name": name, "count": int(count)} for name, count in category_counts.items()],
    "filters": {
        "brands": sorted(df["brand"].dropna().unique().tolist()),
        "categories": sorted(df["primary_category"].dropna().unique().tolist()),
    },
    "products": products,
}

OUTPUT.write_text("window.FLIPKART_APP_DATA = " + json.dumps(payload, separators=(",", ":")) + ";\n", encoding="utf-8")
print(f"Wrote {OUTPUT.name} with {len(products)} products")

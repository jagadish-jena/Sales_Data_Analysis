# Sales_Data+_Analysis

This project analyzes a Flipkart e-commerce product dataset and presents the results through two dashboard experiences:

- A static HTML/CSS/JavaScript dashboard in `index.html`
- A Python Dash dashboard in `flipkart_dash_app.py`

The analysis focuses on product pricing, discounted selling price, discount percentage, top brands, top product categories, category contribution, and a simple linear regression model that predicts discounted price from retail price.

## Project Overview

The dataset used in this project is `flipkart_com-ecommerce_sample (1).xls`. In this folder, the file is read with `pandas.read_csv()`, so it is treated like a CSV-formatted dataset even though the extension is `.xls`.

Main analysis steps:

1. Load the Flipkart product dataset.
2. Clean price columns such as `retail_price` and `discounted_price`.
3. Clean product names, brands, ratings, and category fields.
4. Extract primary and secondary categories from `product_category_tree`.
5. Calculate discount percentage.
6. Build summary metrics for products, brands, categories, and prices.
7. Train a linear regression model to estimate discounted price from retail price.
8. Display the results in interactive dashboards.

## Key Features

- Product search by product name or brand
- Category and brand filters
- Retail price and discount percentage range filters
- Sort options for price, discount, and product name
- Summary cards for filtered products and sales values
- Top brand and category charts
- Retail price distribution chart
- Category share pie chart
- Brand sales bar graph
- Actual vs predicted discounted price chart
- Product table with filtered results
- Price prediction tool based on linear regression
- Python Dash version with dropdown filters and Plotly charts

## Current Dataset Summary

These values come from the generated `app-data.js` file:

- Total products: 19,922
- Total brands: 3,486
- Average retail price: Rs. 2,979.21
- Average discounted price: Rs. 1,973.40
- Average discount: 40.52%
- Maximum retail price: Rs. 571,230
- Minimum retail price: Rs. 35
- Model R2 score: 0.9706
- Model mean squared error: 914,304.82

## Folder Structure

```text
SALES_DATA_ANALYSIS/
|-- app-data.js
|-- flipkart_com-ecommerce_sample (1).xls
|-- flipkart_dash_app.py
|-- index.html
|-- prepare_data.py
|-- Sales Data Analysis.ipynb
|-- script.js
|-- style.css
`-- README.md
```

## File Details

| File | Purpose |
| --- | --- |
| `flipkart_com-ecommerce_sample (1).xls` | Source Flipkart product dataset |
| `Sales Data Analysis.ipynb` | Jupyter notebook for exploratory analysis |
| `prepare_data.py` | Cleans the dataset, trains the regression model, and generates `app-data.js` |
| `app-data.js` | Generated JavaScript data used by the static dashboard |
| `index.html` | Static dashboard page |
| `style.css` | Styling for the static dashboard |
| `script.js` | Dashboard interactions, filters, charts, table rendering, and price prediction |
| `flipkart_dash_app.py` | Python Dash dashboard using Plotly charts |

## Requirements

Use Python 3.10 or newer.

Install the required Python libraries:

```bash
pip install pandas scikit-learn dash plotly
```

If you are using a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install pandas scikit-learn dash plotly
```

## How to Generate Dashboard Data

Run this command whenever the source dataset changes:

```bash
python prepare_data.py
```

This reads `flipkart_com-ecommerce_sample (1).xls`, cleans the data, trains the price prediction model, and writes a fresh `app-data.js` file.

Expected output:

```text
Reading source file: flipkart_com-ecommerce_sample (1).xls
Wrote app-data.js with 19922 products
```

## How to Open the Static Dashboard

Open `index.html` in a browser.

The static dashboard uses:

- `index.html` for page structure
- `style.css` for layout and visual design
- `app-data.js` for generated data
- `script.js` for dashboard logic

No Python server is required for the static dashboard after `app-data.js` has been generated.

## How to Run the Dash App

Run:

```bash
python flipkart_dash_app.py
```

Then open:

```text
http://127.0.0.1:8050
```

The Dash app includes:

- Brand filter
- Primary category filter
- Secondary category filter
- Flipkart Advantage filter
- Product count bar chart
- Retail vs discounted price scatter plot
- Category histogram
- Category share pie chart
- Average discount line chart

## Machine Learning Model

The project uses a simple linear regression model:

- Input feature: `retail_price`
- Target value: `discounted_price`
- Model type: `LinearRegression` from scikit-learn
- Train/test split: 80% training and 20% testing
- Random state: 42

The current generated model has:

- Slope: 0.80607497
- Intercept: -425.07111031
- R2 score: 0.9706

This model is useful for a basic price prediction demonstration. It should not be treated as a production pricing model because it only uses retail price as the input feature.

## Troubleshooting

If the dashboard shows empty data, regenerate `app-data.js`:

```bash
python prepare_data.py
```

If Python cannot find required packages, install them:

```bash
pip install pandas scikit-learn dash plotly
```

If the Dash app does not start, make sure the dataset file is present in the same folder as `flipkart_dash_app.py`.

If another process is already using port `8050`, change the run line in `flipkart_dash_app.py` to use another port:

```python
app.run(debug=True, port=8051)
```

## Notes

- `app-data.js` is generated from `prepare_data.py`.
- The dataset file is large, so dashboard loading time may depend on the browser and system performance.
- Some brand values in the dataset are missing or noisy, so the project fills missing values with `Unknown`.
- The file extension is `.xls`, but the project reads it with `pd.read_csv()`.

import dash
from dash import dcc, html
import pandas as pd
import plotly.express as px
from dash.dependencies import Input, Output
from pathlib import Path


app = dash.Dash(__name__)

DATA_PATH = Path(__file__).resolve().parent / "flipkart_com-ecommerce_sample (1).xls"


def extract_category_levels(value):
    if pd.isna(value):
        return "Unknown", "Unknown"

    text = str(value).strip()
    text = text.replace('[""', "").replace('""]', "")
    text = text.replace('["', "").replace('"]', "")

    parts = [part.strip().strip('"') for part in text.split(">>") if part.strip()]

    primary = parts[0] if parts else "Unknown"
    secondary = parts[1] if len(parts) > 1 else primary
    return primary, secondary


df = pd.read_csv(DATA_PATH)
df.columns = df.columns.str.strip()

df["retail_price"] = pd.to_numeric(df["retail_price"], errors="coerce")
df["discounted_price"] = pd.to_numeric(df["discounted_price"], errors="coerce")
df["product_rating_num"] = pd.to_numeric(df["product_rating"], errors="coerce")

df["brand"] = df["brand"].fillna("Unknown").astype(str).str.strip()
df["product_name"] = df["product_name"].fillna("Unknown Product").astype(str).str.strip()
df["is_FK_Advantage_product"] = (
    df["is_FK_Advantage_product"].fillna(False).astype(str).str.strip().str.title()
)

category_levels = df["product_category_tree"].apply(extract_category_levels)
df["primary_category"] = category_levels.str[0]
df["secondary_category"] = category_levels.str[1]

df["discount_percent"] = (
    (df["retail_price"] - df["discounted_price"]) / df["retail_price"] * 100
)
df["discount_percent"] = (
    df["discount_percent"].replace([float("inf"), float("-inf")], pd.NA).fillna(0)
)

required_cols = [
    "brand",
    "primary_category",
    "secondary_category",
    "is_FK_Advantage_product",
    "retail_price",
    "discounted_price",
]

df = df.dropna(subset=required_cols).copy()
df = df[df["retail_price"] > 0].copy()

filter_cols = [
    "brand",
    "primary_category",
    "secondary_category",
    "is_FK_Advantage_product",
]

for col in filter_cols:
    df[f"{col}_clean"] = df[col].astype(str).str.strip().str.lower()


def get_options(column):
    temp = df[[column, f"{column}_clean"]].drop_duplicates().sort_values(column)
    return [
        {"label": row[column], "value": row[f"{column}_clean"]}
        for _, row in temp.iterrows()
    ]


dropdown_style = {
    "width": "220px",
    "margin": "8px",
    "fontSize": "13px",
}

graph_layout = {
    "plot_bgcolor": "#1e1e2f",
    "paper_bgcolor": "#1e1e2f",
    "font_color": "white",
}

color_map = {
    "True": "#00f5d4",
    "False": "#ff6b6b",
}


app.layout = html.Div(
    style={
        "background": "linear-gradient(to right, #141e30, #243b55)",
        "padding": "20px",
        "minHeight": "100vh",
    },
    children=[
        html.H1(
            "Flipkart E-Commerce Dashboard",
            style={"textAlign": "center", "color": "#00f5d4"},
        ),
        html.Div(
            style={"display": "flex", "justifyContent": "space-between", "flexWrap": "wrap"},
            children=[
                html.Div(
                    [
                        dcc.Dropdown(
                            id="brand",
                            options=get_options("brand"),
                            multi=True,
                            placeholder="Select Brand",
                            style=dropdown_style,
                        ),
                        dcc.Dropdown(
                            id="primary-category",
                            options=get_options("primary_category"),
                            multi=True,
                            placeholder="Select Primary Category",
                            style=dropdown_style,
                        ),
                    ]
                ),
                html.Div(
                    [
                        dcc.Dropdown(
                            id="secondary-category",
                            options=get_options("secondary_category"),
                            multi=True,
                            placeholder="Select Sub Category",
                            style=dropdown_style,
                        ),
                        dcc.Dropdown(
                            id="fk-advantage",
                            options=get_options("is_FK_Advantage_product"),
                            multi=True,
                            placeholder="Flipkart Advantage",
                            style=dropdown_style,
                        ),
                    ]
                ),
            ],
        ),
        html.Div(
            id="selection-output",
            style={
                "marginTop": "15px",
                "padding": "15px",
                "background": "#1e1e2f",
                "borderRadius": "12px",
                "display": "flex",
                "justifyContent": "space-around",
                "color": "white",
                "flexWrap": "wrap",
                "gap": "16px",
            },
        ),
        html.Div(
            [
                dcc.Graph(id="bar", style={"width": "50%"}),
                dcc.Graph(id="scatter", style={"width": "50%"}),
            ],
            style={"display": "flex", "flexWrap": "wrap"},
        ),
        html.Div(
            [
                dcc.Graph(id="hist", style={"width": "50%"}),
                dcc.Graph(id="pie", style={"width": "50%"}),
            ],
            style={"display": "flex", "flexWrap": "wrap"},
        ),
        dcc.Graph(id="line"),
    ],
)


@app.callback(
    [
        Output("bar", "figure"),
        Output("scatter", "figure"),
        Output("hist", "figure"),
        Output("pie", "figure"),
        Output("line", "figure"),
        Output("selection-output", "children"),
    ],
    [
        Input("brand", "value"),
        Input("primary-category", "value"),
        Input("secondary-category", "value"),
        Input("fk-advantage", "value"),
    ],
)
def update_dashboard(brands, primary_categories, secondary_categories, fk_advantage):
    filtered = df.copy()

    if brands:
        filtered = filtered[filtered["brand_clean"].isin(brands)]

    if primary_categories:
        filtered = filtered[filtered["primary_category_clean"].isin(primary_categories)]

    if secondary_categories:
        filtered = filtered[filtered["secondary_category_clean"].isin(secondary_categories)]

    if fk_advantage:
        filtered = filtered[filtered["is_FK_Advantage_product_clean"].isin(fk_advantage)]

    if filtered.empty:
        empty_fig = px.scatter(title="No data available for selected filters")
        empty_fig.update_layout(**graph_layout)
        return (
            empty_fig,
            empty_fig,
            empty_fig,
            empty_fig,
            empty_fig,
            "No matching data",
        )

    bar_data = (
        filtered.groupby(["brand", "primary_category"])
        .size()
        .reset_index(name="Count")
        .sort_values("Count", ascending=False)
        .head(15)
    )
    bar = px.bar(
        bar_data,
        x="brand",
        y="Count",
        color="primary_category",
        title="Top Brands by Product Count",
    )

    scatter = px.scatter(
        filtered,
        x="retail_price",
        y="discounted_price",
        color="is_FK_Advantage_product",
        size="discount_percent",
        hover_name="product_name",
        title="Retail Price vs Discounted Price",
        color_discrete_map=color_map,
    )

    hist = px.histogram(
        filtered,
        x="primary_category",
        color="is_FK_Advantage_product",
        title="Products by Primary Category",
        color_discrete_map=color_map,
    )

    pie_data = (
        filtered.groupby("primary_category")
        .size()
        .reset_index(name="Count")
        .sort_values("Count", ascending=False)
        .head(10)
    )
    pie = px.pie(
        pie_data,
        names="primary_category",
        values="Count",
        title="Category Share",
    )

    line_data = (
        filtered.groupby(["primary_category", "is_FK_Advantage_product"], as_index=False)[
            "discount_percent"
        ]
        .mean()
        .sort_values("discount_percent", ascending=False)
        .head(15)
    )
    line = px.line(
        line_data,
        x="primary_category",
        y="discount_percent",
        color="is_FK_Advantage_product",
        markers=True,
        title="Average Discount % by Category",
        color_discrete_map=color_map,
    )

    for fig in [bar, scatter, hist, pie, line]:
        fig.update_layout(**graph_layout)

    bar.update_xaxes(tickangle=45)
    hist.update_xaxes(tickangle=45)
    line.update_xaxes(tickangle=45)

    def format_val(val):
        return ", ".join(val) if val else "No filter"

    selection = [
        html.Div([html.B("Brand"), html.P(format_val(brands))]),
        html.Div([html.B("Primary Category"), html.P(format_val(primary_categories))]),
        html.Div([html.B("Sub Category"), html.P(format_val(secondary_categories))]),
        html.Div([html.B("FK Advantage"), html.P(format_val(fk_advantage))]),
    ]

    return bar, scatter, hist, pie, line, selection


if __name__ == "__main__":
    app.run(debug=True)
    print("http://127.0.0.1:8050")

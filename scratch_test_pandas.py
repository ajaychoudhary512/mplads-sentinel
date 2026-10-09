import pandas as pd
import numpy as np

df = pd.DataFrame({
    'date': pd.to_datetime(['2023-01-01', None, '2023-01-02']),
    'val': [1.0, np.nan, 3.0],
    'text': ['A', None, 'C']
})

df['date'] = pd.to_datetime(df['date'], errors='coerce')

# Convert dates to pydatetime where possible
for col in ['date']:
    if df[col].dtype == 'datetime64[ns]':
        df[col] = df[col].dt.to_pydatetime()

df_clean = df.where(pd.notnull(df), None)
records = df_clean.to_dict('records')

for r in records:
    print(r)

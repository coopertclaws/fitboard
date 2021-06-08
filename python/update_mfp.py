from datetime import datetime, timedelta, date
from dateutil import parser
import json
import csv
import pandas as pd
from google.oauth2 import service_account
import pygsheets
import myfitnesspal

with open('service_account.json') as source:
    info = json.load(source)
credentials = service_account.Credentials.from_service_account_info(info)

client = pygsheets.authorize(service_account_file='service_account.json')

sheet = client.open_by_key('GSHEETID_GOES_HERE')

wks = sheet.worksheet_by_title('WORKSHEET_NAME')

first_column = wks.get_col(1)
first_column_data = first_column[1:] # ignore 1st row

# Loop through each row until last date
row_ref = 1
for row in first_column_data:
    if not row:
        continue
    row_ref += 1
    latest_date = row

next_row = row_ref

latest_date=parser.parse(latest_date)
new_latest_date=(latest_date + timedelta(1))
current_date = datetime.today().strftime('%Y-%m-%d')
#print(current_date)
#yesterday = (datetime.now() - timedelta(1)).strftime('%Y-%m-%d')
yesterday = (datetime.now() - timedelta(1))
#print(yesterday)

delta = timedelta(days=1)
while new_latest_date <= yesterday:
    #print(new_latest_date)
    date_str = new_latest_date.strftime('%Y-%m-%d')
    #print(date_str)
    date_split = date_str.split("-")
    year = date_split[0]
    month = date_split[1]
    day = date_split[2]
    mfpclient = myfitnesspal.Client('MFP_USERNAME')
    result = mfpclient.get_date(year, month, day)
    calories=(result.totals['calories'])
    carbs=(result.totals['carbohydrates'])
    fat=(result.totals['fat'])
    protein=(result.totals['protein'])
    sodium=(result.totals['sodium'])
    sugar=(result.totals['sugar'])
    new_row=[date_str, calories, carbs, fat, protein, sodium, sugar]
    print(f"Inserting at line {next_row}")
    print(new_row)
    wks.insert_rows(next_row, values=new_row)

    next_row += 1
    new_latest_date += delta






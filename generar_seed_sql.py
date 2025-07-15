import pandas as pd
import uuid

# Cargar datos
tabla1 = pd.read_csv("tabla1_limpia.csv")
tabla2 = pd.read_csv("tabla2_limpia.csv")

# Definir correspondencia de columnas de acciones con los nombres lógicos de la columna 0 de tabla2
acciones_map = {
    "Gra": "Acciones Grandes",
    "Med": "Acciones Medianas",
    "Peq": "Acciones Pequeñas",
    "Sup": "Acciones Super",
    "BN": "Bono Navideño",
    # Si tienes Min, mapea a Pequeñas o según corresponda
    "Min": "Acciones Pequeñas"
}

# Crear diccionario de stocks con UUIDs fijos usando la columna 0 (nombre lógico)
stock_types = {}
stock_sql = []
for idx, row in tabla2.iterrows():
    tipo = str(row[0]).strip()
    if tipo in ["Valor anterior", "T", "0", ""]:
        continue
    stock_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, tipo))
    stock_types[tipo] = stock_id
    value = float(row[5]) if not pd.isna(row[5]) else 0
    monthly_contribution = float(row[4]) if not pd.isna(row[4]) else 0
    stock_sql.append(
        f"insert into public.stocks (id, type, value, monthly_contribution, is_guaranteed, behavior) values ('{stock_id}', '{tipo}', {value}, {monthly_contribution}, false, 'CAPITAL_APPRECIATION');"
    )

# Crear miembros con UUIDs fijos
members_sql = []
member_ids = {}
for idx, row in tabla1.iterrows():
    name = str(row["NOMBRE DEL SOCIO "]).strip()
    if name == "NAN" or name == "" or name == "0":
        continue
    member_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, name))
    member_ids[name] = member_id
    members_sql.append(
        f"insert into public.members (id, name) values ('{member_id}', '{name}');"
    )

# Crear subscripciones de acciones
subs_sql = []
for idx, row in tabla1.iterrows():
    name = str(row["NOMBRE DEL SOCIO "]).strip()
    if name == "NAN" or name == "" or name == "0":
        continue
    member_id = member_ids[name]
    for col, tipo_accion in acciones_map.items():
        cantidad = row.get(col, 0)
        if pd.isna(cantidad) or float(cantidad) == 0:
            continue
        stock_id = stock_types.get(tipo_accion)
        if not stock_id:
            continue
        sub_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{name}-{tipo_accion}"))
        subs_sql.append(
            f"insert into public.stock_subscriptions (id, member_id, stock_id, quantity, status) values ('{sub_id}', '{member_id}', '{stock_id}', {int(cantidad)}, 'active');"
        )

# Crear préstamos por socio
def crear_prestamo_sql(member_id, loan_type, cuota_col, interes_col, tasa):
    cuota = row.get(cuota_col, 0)
    interes = row.get(interes_col, 0)
    if pd.isna(cuota) or float(cuota) == 0 or pd.isna(interes) or float(interes) == 0:
        return None
    cuota = float(cuota)
    interes = float(interes)
    saldo = interes / tasa
    prestamo_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{member_id}-{loan_type}"))
    return f"insert into public.loans (id, member_id, loan_type, approved_amount, disbursed_amount, outstanding_balance, monthly_payment_amount, interest_rate, status) values ('{prestamo_id}', '{member_id}', '{loan_type}', {saldo:.2f}, {saldo:.2f}, {saldo:.2f}, {cuota:.2f}, {tasa:.4f}, 'active');"

loans_sql = []
for idx, row in tabla1.iterrows():
    name = str(row["NOMBRE DEL SOCIO "]).strip()
    if name == "NAN" or name == "" or name == "0":
        continue
    member_id = member_ids[name]
    # Corriente
    sql = crear_prestamo_sql(member_id, 'corriente', 'Cuota Corriente', 'Interes Corriente', 0.015)
    if sql:
        loans_sql.append(sql)
    # Agil
    sql = crear_prestamo_sql(member_id, 'agil', 'Cuota Agil', 'Interez Agil', 0.02)
    if sql:
        loans_sql.append(sql)
    # Prioritario
    if 'Cuota Prioritario' in row and 'Interes Prioritario' in row:
        sql = crear_prestamo_sql(member_id, 'prioritario', 'Cuota Prioritario', 'Interes Prioritario', 0.02)
        if sql:
            loans_sql.append(sql)
    # Accion
    sql = crear_prestamo_sql(member_id, 'accion', 'Abono Accion', 'Interes Accion', 0.015)
    if sql:
        loans_sql.append(sql)

# Guardar el SQL en un archivo
with open("seed_poblacion.sql", "w") as f:
    f.write("-- Poblar stocks\n")
    for line in stock_sql:
        f.write(line + "\n")
    f.write("\n-- Poblar miembros\n")
    for line in members_sql:
        f.write(line + "\n")
    f.write("\n-- Poblar subscripciones de acciones\n")
    for line in subs_sql:
        f.write(line + "\n")
    f.write("\n-- Poblar prestamos\n")
    for line in loans_sql:
        f.write(line + "\n")

print("Archivo seed_poblacion.sql generado correctamente.") 